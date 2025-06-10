
import CObject3D, { Node, types } from "@ff/scene/components/CObject3D";
import CScene from "@ff/scene/components/CScene";
import CVModel2 from "./CVModel2";
import CPulse, { IPulseContext, IPulseEvent } from "@ff/graph/components/CPulse";
import Component from "@ff/graph/Component";
import { EAssetType, EDerivativeQuality, EDerivativeUsage } from "client/schema/model";
import CRenderer from "@ff/scene/components/CRenderer";
import { Vector2, Vector3, Box3, Matrix4, Quaternion, Spherical, Plane, Euler } from "three";
import CTransform from "@ff/scene/components/CTransform";
import CVNode from "./CVNode";
import * as helpers from "@ff/three/helpers";
import { IS_MOBILE } from "client/constants";

interface ILOD{
  enabled?:boolean;
}

/**
 * Expected map sizes in pixels
 * The number given is number of pixels for a square map of the expected quality
 */
const sizes = {
  [EDerivativeQuality.High]: 4096*4096,
  [EDerivativeQuality.Medium]: 2048*2048,
  [EDerivativeQuality.Low]: 1024*1024,
  [EDerivativeQuality.Thumb]: 512*512,
} as const

/**Absolute minimum value under which we do not expect to be able to function properly */
const MIN_BUDGET = sizes[EDerivativeQuality.High]*2;

interface ModelDisplayState{
  model :CVModel2;
  qualityRequest :EDerivativeQuality;
  clipped :boolean;
  weight: number;
}

function getSize(model :CVModel2, quality :EDerivativeQuality) :number{
  const bestMatchDerivative = model.derivatives.select(EDerivativeUsage.Web3D, quality);
  const asset = bestMatchDerivative.findAsset(EAssetType.Model);
  return ((asset?.data?.imageSize )? Math.pow(asset.data.imageSize, 2): sizes[bestMatchDerivative.data.quality]);
}

/**
 * How far from center is the centermost part of the object?
 * dxy = 0: Object crosses the image's center
 * dxy = 1 object's nearest point would be just outside screen space if located on the X or Y axis
 * dxy = 2: Object's nearest border is just beyond the screen's diagonal edge
 * We add X offset and Y offset because we kind of _want_ diagonals to be a little underweighted
 * 
 */
export function maxCenterWeight(b :Box3){
    let dxy = Math.max(-b.max.x, b.min.x, 0) + Math.max(-b.max.y, b.min.y, 0);
    return 1 / (Math.pow(1+dxy,4));
}


const hyst = 0.02; //In absolute % of screen area unit
const steps = [
    [0.04, EDerivativeQuality.Thumb],
    [0.1, EDerivativeQuality.Low],
    [0.4, EDerivativeQuality.Medium],
];
/**
 * Calculate desired quality setting
 * 
 * An hysteresis is necessary to prevent flickering, 
 * but it would be interesting to configure if we upgrade-first or downgrade-first
 * depending on resources contention 
 * 
 * @fixme here we should take into account the renderer's resolution:
 * we probably don't need a 4k texture when rendering an object over 40% of a 800px viewport
 */
export function getQuality(current :EDerivativeQuality, relSize:number):EDerivativeQuality{
  return steps.find(([size, q])=>{
      if (current <= q) size += hyst;
      return relSize < size;
  })?.[1] ?? EDerivativeQuality.High;
}

const _localBox = new Box3(); // in world coordinates
const _cameraXAxis = new Vector3();
const _cameraYAxis = new Vector3();
const _vec3a = new Vector3();
const _vecSphericala = new Spherical();
const _vec3b = new Vector3();
const _vecSphericalb = new Spherical();
const _quat = new Quaternion();
const _mat4 = new Matrix4();
const quaternion90AroundZ = new Quaternion().setFromEuler(new Euler(0,0,Math.PI/2));
const quaternionMinus90AroundZ = quaternion90AroundZ.clone().conjugate();

/**
 * Simple moving average basic implementation
 */
class PerfCounter{
  private _prev : number = 0;
  private _buf :number[];
  private _cursor = 0;
  /**
   * 
   * @param length Moving average length
   * @param initial initial value to prefill the array with, defaults to 0
   */
  constructor(length:number, initial ?:number){
    this._buf = new Array(length);
    if(typeof initial === "number") this.reset(initial);
  }

  /**
   * Add a timestamp
   * @param {number} t Timestamp
   * @param {number} mult Multiplier (how many frames elapsed)
   */
  push(t :number, mult:number) :number{
    this._buf[this._cursor] = mult/(t - this._prev);
    this._prev = t;
    this._cursor = (this._cursor + 1) % this._buf.length;
    return this.get();
  }

  get() :number{
    return this._buf.reduce((sum, value)=>sum + value, 0) / this._buf.length;
  }

  reset(n :number){
    for(let i = 0; i< this._buf.length; i++){
      this._buf[i] = n;
    }
  }
}

/**
 * Dynamic LOD handling. * 
 */
export default class CVDerivativesController extends Component{

  static readonly typeName: string = "CVDerivativesController";
  static readonly isSystemSingleton: boolean = true;

  static readonly text: string = "Derivatives selection";
  static readonly icon: string = "";

  private _fps = new PerfCounter(10, 60);

  private _budget = sizes[EDerivativeQuality.High]*2;

  private _last_updated: number = 0;
  private _should_update: boolean = false;

  threshold(q :EDerivativeQuality){
    return this._budget - sizes[q]*2;
  }

  protected static readonly ins = {
    enabled: types.Boolean("LOD.Enabled", true),
  }


  ins = this.addInputs<CObject3D, typeof CVDerivativesController.ins>(CVDerivativesController.ins);


  get settingProperties() {
    return [
        this.ins.enabled,
    ];
  }
  private _scene :CScene;
  protected get renderer() {
    return this.getMainComponent(CRenderer);
  }

  get activeScene(){
    return this.renderer?.activeSceneComponent;
  }

  constructor(node: Node, id: string)
  {
      super(node, id);
      this._scene = this.activeScene;
      this.renderer.outs.maxTextureSize.on("value", this.setTextureBudget);
  }


  setTextureBudget = ()=> {
    // We expect scene performance to always be texture-limited.
    // For example a hundred untextured objects with 25k vertices each would pose absolutely no problem even to a low end mobile device. 
    // However a few 4k maps are enough to overload such a device's GPU and internet connection.
    // First, evaluate raw maximum texture space as an upper bound. This is halved because:
    //  1. we don't particularly want to max-out. This is not a "reasonable", but a "system max supported" value. 
    //  2. This is total available space and any object can have any number of textures (we'd be able to refine this exact number if we wanted)
    //      to which we need to add lightmaps, environment, etc. We just simplify to 1/4 the texture space
    let budget = Math.pow(this.renderer.outs.maxTextureSize.value/2, 2);
    let reasons :string[] = [];
    if(typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency < 4){
      reasons.push("low CPU");
      budget = budget/2;
    }
    if(IS_MOBILE){
      reasons.push("mobile device");
      budget = budget/2;
    }
    if(typeof (navigator as any).deviceMemory === "number" && (navigator as any).deviceMemory < 8){
      reasons.push("low RAM");
      budget = Math.min(budget, sizes[EDerivativeQuality.High]*4);
    }
    this._budget = Math.max(MIN_BUDGET, budget);
    if(reasons.length) console.debug(`Lowered Performance budget: ${Math.sqrt(this._budget)} (${reasons.join(", ")})`);
  }

  tock(context :IPulseContext) :boolean{
    const cameraComponent = this._scene?.activeCameraComponent;
    if (!this.ins.enabled.value || !cameraComponent) {
        return false;
    }

    if(!context.tickUpdated && !context.tockUpdated && !this._should_update) return false;
    
    //LOD is recomputed every half seconds max
    if(context.secondsElapsed < this._last_updated + 0.5){
      this._should_update = true;
      return false;
    }
    //We are updating now, so set this to false.
    this._should_update = false
    this._last_updated = context.secondsElapsed;

    let currently_loading = 0;
//    const weights :Array<[string, any]>= [];
    const cameraToWorldQuaternion = new Quaternion;
    cameraComponent.camera.getWorldQuaternion(cameraToWorldQuaternion);
    _cameraXAxis.set(1,0,0).applyQuaternion(cameraToWorldQuaternion);
    const worldToCameraQuaternion = cameraToWorldQuaternion.clone().conjugate();
    _cameraYAxis.set(0,1,0).applyQuaternion(cameraToWorldQuaternion);
    quaternion90AroundZ.setFromEuler(new Euler(0,0,Math.PI/2));
    const boxCenterInCamera = new Vector3; 

    let collection :Array<ModelDisplayState> = this.getGraphComponents(CVModel2).map(model=>{
      let sphericalCoordinates: Array<Spherical>= [];
      let rotatedSphericalCoordinates: Array<Spherical>= [];
      let facingSphericalCoordinates: Array<Spherical>= [];
      let facingrotatedSphericalCoordinates: Array<Spherical>= [];
      const cameraToFacingBoxQuaternion = new Quaternion;
      const facingBoxToCameraQuaternion = new Quaternion;

      //We can't just use the model's matrixWorld here because it might not have loaded yet.
      //In this case the bounding box is whatever's defined in the scene file.
      const scale = model.outs.unitScale.value;
      let t :CTransform|CVNode = model.transform;
      _localBox.copy(model.localBoundingBox);
 
      _vec3a.fromArray(model.ins.position.value).multiplyScalar(scale);
      helpers.degreesToQuaternion(model.ins.rotation.value, CVModel2.rotationOrder, _quat);
      _vec3b.setScalar(scale);
      _mat4.compose(_vec3a, _quat, _vec3b);
      _localBox.applyMatrix4(_mat4);

      while(t){
        _mat4.fromArray(t.outs.matrix.value);
        _localBox.applyMatrix4(_mat4);
        t = t.parent as CTransform|CVNode;
      }
      let clipped = true;

      ///// ============ SPHERICAL COORDINATES OF THE BOX ============
      let cameraPosition = new Vector3;
      cameraComponent.camera.getWorldPosition(cameraPosition);
      [
        [_localBox.min.x, _localBox.min.y, _localBox.min.z],
        [_localBox.max.x, _localBox.min.y, _localBox.min.z],
        [_localBox.max.x, _localBox.max.y, _localBox.min.z],
        [_localBox.max.x, _localBox.max.y, _localBox.max.z],
        [_localBox.min.x, _localBox.max.y, _localBox.max.z],
        [_localBox.min.x, _localBox.min.y, _localBox.max.z],
        [_localBox.max.x, _localBox.min.y, _localBox.max.z],
        [_localBox.min.x, _localBox.max.y, _localBox.min.z],
      ].map((coords:[x: number,y:  number,z: number], index)=>{
          // Future optimisation : calculate only thetas and not all spherical coordinates :

          _vec3a.set(...coords).sub(cameraPosition);
          cameraComponent.camera.getWorldQuaternion(cameraToWorldQuaternion);
          _vec3a.applyQuaternion(worldToCameraQuaternion); 

          // spherical coordinates for theta1, horizontal regarding to camera
          _vecSphericala.setFromVector3(_vec3a);
          sphericalCoordinates.push(_vecSphericala.clone())

          // spherical coordinates for theta2, vertical regarding to camera
          const _vecRotatedAroundZ = _vec3a.clone().applyQuaternion(quaternionMinus90AroundZ); 
          _vecSphericalb.setFromVector3(_vecRotatedAroundZ);
          rotatedSphericalCoordinates.push(_vecSphericalb.clone());
        
          // create quaternions for a basis facing the box from the camera point :
          _localBox.getCenter(_vec3b);
          _vec3b.sub(cameraPosition);
          _vec3b.applyQuaternion(worldToCameraQuaternion); 
          boxCenterInCamera.copy(_vec3b);

          cameraToFacingBoxQuaternion.setFromUnitVectors(boxCenterInCamera.clone().normalize(), new Vector3(0,0,-1));
          facingBoxToCameraQuaternion.copy(cameraToFacingBoxQuaternion).conjugate();

          // spherical coordinates for theta3, horizontal when facing the box
          const boxFacingCoordinates = _vec3a.clone().applyQuaternion(cameraToFacingBoxQuaternion);
          _vecSphericalb.setFromVector3(boxFacingCoordinates);
          facingSphericalCoordinates.push(_vecSphericalb.clone());

          // spherical coordinates for theta4, vertical when facing the box
          const boxFacingSphericalCoordinatesRotated = boxFacingCoordinates.clone().applyQuaternion(quaternionMinus90AroundZ); 
          _vecSphericalb.setFromVector3(boxFacingSphericalCoordinatesRotated);
          facingrotatedSphericalCoordinates.push(_vecSphericalb.clone());
        });

      cameraComponent.camera.getWorldPosition(_vec3a);
      //Best-case distance
      const distance =  _localBox.distanceToPoint(_vec3a)/cameraComponent.camera.far;

      ////====================== box camera distance  =============================
      
      // Default values in case we are inside the box :
      let sphericalAngularArea = (2*Math.PI)**2;
      let sphericalAngularDistance = 0;
      let boxCameraDistance = distance;
      if (boxCameraDistance > 0){
 
        //// =================== Calculate angle differences ========================
        // The box does NOT include the camera 
        // To measure how the object circular arcs are distant from the center of the camera. 

        // =============== Theta1 angle ===============================
        // used now only for distance 
        let maxTheta = Math.max(...sphericalCoordinates.map((point: Spherical)=> point.theta));
        let minTheta = Math.min(...sphericalCoordinates.map((point: Spherical)=> point.theta));
        let thetaDistance = Math.PI - Math.max(Math.abs(maxTheta), Math.abs(minTheta));

        // check if the box is across the half plane where changes sign and z < 0 (ie seen by the camera)
        // local box is in world coordinates
        const boxMinInCameraCoordinates = new Vector3(_localBox.min.x,_localBox.min.y, _localBox.min.z);
        boxMinInCameraCoordinates.sub(cameraPosition).applyQuaternion(worldToCameraQuaternion);
        const isBoxAcrossThetaHalfPlane: boolean = _localBox.intersectsPlane(new Plane(_cameraXAxis,-_cameraXAxis.dot(cameraPosition))) && (boxMinInCameraCoordinates.z < 0);
        if (isBoxAcrossThetaHalfPlane){ 
          thetaDistance = 0;
        };

        // ========== Theta angle 2 ============
        // Also used only for distance */
        let maxTheta2 = Math.max(...rotatedSphericalCoordinates.map((point: Spherical)=> point.theta));
        let minTheta2 = Math.min(...rotatedSphericalCoordinates.map((point: Spherical)=> point.theta));
        let thetaDistance2 = Math.PI - Math.max(Math.abs(maxTheta2), Math.abs(minTheta2));

        const isBoxAcrossTheta2HalfPlane: boolean = _localBox.intersectsPlane(new Plane(_cameraYAxis,-_cameraYAxis.dot(cameraPosition))) && (boxMinInCameraCoordinates.z < 0);
        if (isBoxAcrossTheta2HalfPlane){ 
          thetaDistance2 = 0;
        };

        //=================  Theta 3 and 4,  facing the box ================
        // used for calculate an approximation of the screen space if the camera was pointing at the box
        _localBox.getCenter(_vec3a);
        _vec3a.sub(cameraPosition);
        _vec3a.applyQuaternion(worldToCameraQuaternion);
        
        const maxTheta3Neg = Math.max(...facingSphericalCoordinates.filter((point: Spherical)=> point.theta<0).map((point: Spherical)=> point.theta));
        const minTheta3Pos = Math.min(...facingSphericalCoordinates.filter((point: Spherical)=> point.theta>0).map((point: Spherical)=> point.theta));  
        const thetaAngle3 = 2*Math.PI - minTheta3Pos + maxTheta3Neg; 

        const maxTheta4Neg = Math.max(...facingrotatedSphericalCoordinates.filter((point: Spherical)=> point.theta<0).map((point: Spherical)=> point.theta));
        const minTheta4Pos = Math.min(...facingrotatedSphericalCoordinates.filter((point: Spherical)=> point.theta>0).map((point: Spherical)=> point.theta));  
        const thetaAngle4 = 2*Math.PI - minTheta4Pos + maxTheta4Neg; 

        sphericalAngularArea = Math.abs (thetaAngle3*thetaAngle4)
        sphericalAngularDistance = new Vector2(thetaDistance, thetaDistance2).length();        
      }
      const depthMod = Math.max(1-distance, 0.1);
//    weights.push([model.ins.name.value, {distance, angle, depthMod, angleMod, visibleSize}]);

      const sphericalAngleMod = (1 - Math.abs(sphericalAngularDistance/Math.sqrt(Math.PI**2 + Math.PI**2)));
      const weight = 2 * depthMod * sphericalAngularArea * sphericalAngleMod

     //Upgrade only here
      let qualityRequest =  model.derivatives.select(EDerivativeUsage.Web3D, getQuality(model.ins.quality.value, sphericalAngularArea))?.data.quality;
      if(model.isLoading()) currently_loading++;
      return {model, clipped, weight, qualityRequest} as ModelDisplayState;
    })
    .sort((a, b)=> a.weight - b.weight) //Sort low weights first



    let downgrades = new Map<CVModel2, EDerivativeQuality>();
    /** Separate upgrade path. We compute uprgades first but apply them last */
    let upgrades = new Map<CVModel2, EDerivativeQuality>();
    let upgradesWeights = new Array<[CVModel2, number]>();
    let textureSize = 0;
    let textureSizeBeforeUpgrades = 0;
    //Now we have a list of  best-fit quality requests.
    //We first compute how much texture space upgrading this would use
    //to know whether or not we'd want to downgrade some models
    let downgradable :ModelDisplayState[] = [];
    for(let item of collection){
      let current_quality = item.model.ins.quality.value;
      if(item.model.isLoading() && current_quality != item.qualityRequest && item.model.activeDerivative){
        // Opportunistically cancel any derivative we no longer want.
        // We only want to authorize to cancel upsizing here, otherwise it cancels priority downsizing
        // Additionally, set the quality to the current derivative's value
        if (item.qualityRequest < current_quality){
          item.model.ins.quality.setValue(item.model.activeDerivative.data.quality);
          current_quality = item.model.activeDerivative.data.quality;
          currently_loading --;
        }
      }
      textureSizeBeforeUpgrades += getSize(item.model, current_quality);
      
      if(current_quality < item.qualityRequest){
        //Upgrade models as requested
        upgrades.set(item.model, item.qualityRequest);
        upgradesWeights.push([item.model, item.weight]);
        current_quality = item.qualityRequest;
      }else if(item.qualityRequest < item.model.ins.quality.value){
        downgradable.push(item);
      }
      textureSize += getSize(item.model, current_quality);
    }
    
    // We cancel downsizing only if target textures are not over the allowed budget
    if (textureSize < this._budget){
      collection.filter((item)=> (item.model.isLoading() && item.model.ins.quality.value != item.qualityRequest && item.model.activeDerivative)).forEach((item)=> {
          item.model.ins.quality.setValue(item.model.activeDerivative.data.quality);
          currently_loading --;
          textureSize += getSize(item.model, item.qualityRequest) - getSize(item.model, item.model.ins.quality.value);
          textureSizeBeforeUpgrades += getSize(item.model, item.qualityRequest) - getSize(item.model, item.model.ins.quality.value);
      })
    }


    //Now we decide what to downgrade

    for(let item of downgradable){
      /**Opportunistic downgrade :
       * Happens only as long as one of these conditions are met :
       * - we are near our max budget usage
       * - loading is reasonably idle
       * AND the model is either
       * - entirely clipped 
       * - two levels above the expected quality
       */
      if(
        /* Change this divider to allow us to downgrade further when idle, saving memory */
        textureSize < this._budget/2 
        /* We might allow more downloads to happen in parallel but there is not much performance gains to be expected */
        && 2 < (downgrades.size + upgrades.size + currently_loading) 
      ){
        break;
      }

      if(
        item.clipped
        || item.qualityRequest < item.model.ins.quality.value + 1
      ){
        downgrades.set(item.model, item.qualityRequest);
        textureSize += getSize(item.model, item.qualityRequest) - getSize(item.model, item.model.ins.quality.value);
        textureSizeBeforeUpgrades += getSize(item.model, item.qualityRequest) - getSize(item.model, item.model.ins.quality.value);
      }
    }

    let normal_downgrades = downgrades.size;

    /**
     * Agressive downgrades
     * If we are over-budget, blindly downgrade everything that can be until we are not.
    */
    for(let item of downgradable){
      if(textureSize < this._budget ) break;
      if(downgrades.has(item.model)) continue;
      downgrades.set(item.model, item.qualityRequest);
      textureSize += getSize(item.model, item.qualityRequest) - getSize(item.model, item.model.ins.quality.value);
      textureSizeBeforeUpgrades += getSize(item.model, item.qualityRequest) - getSize(item.model, item.model.ins.quality.value);
    }
    let hard_downgrades = downgrades.size - normal_downgrades;

    /**
     * Cancel upgrades if necessary
     * In some cases too many upgrades are scheduled at once (similarly sized items)
     * We want to prevent that if that would overload the system
     */
    // upgradesWeights is reordered to deal with highest priorities first.
    upgradesWeights.reverse();
    for (let [item, w] of upgradesWeights){
      if(textureSize < this._budget) {
        break; //Run only if overbudget
      }
      // We see if there are models with lower weights that could be downsize to allow to upgrade this item
      const q = upgrades.get(item); // quality requested
      let toDowngrade = new Map<CVModel2, EDerivativeQuality>();
      // texture size if we take into the currently downgraded textures and upgrade the one of "item"
      let textureSizeWithDowngrade = textureSizeBeforeUpgrades + getSize(item, q) - getSize(item, item.ins.quality.value);
      // Identifying models with lower weights (<1.25*weight of item) that could be downgraded. Lower weights are first.
      const downgradables = collection.filter(i => (!(i.model.ins.quality.changed) && i.model.ins.quality.value >= q && i.weight*1.25< w && !downgrades.has(i.model)));
      // Check for a quality one level lower and calculate the amount of texture saved.
      // Stop once it is enough to fit the current "item" upgrade
      let i = 0;
      while (i<downgradables.length && !(textureSizeWithDowngrade < this._budget)){   
        const newQuality = downgradables[i].model.derivatives.select(EDerivativeUsage.Web3D, Math.max(downgradables[i].qualityRequest - 1, 0)).data.quality;
        if (newQuality < downgradables[i].model.ins.quality.value) {
          toDowngrade.set( downgradables[i].model, newQuality);
          textureSizeWithDowngrade += getSize( downgradables[i].model, newQuality) - getSize( downgradables[i].model,  downgradables[i].model.ins.quality.value);
        }
        i++;
      }
      // If enough textures can be downgraded, dowgrade them.
      if (textureSizeWithDowngrade < this._budget){
        for (const [itemToDowngrade, newQuality] of toDowngrade){
          //console.log("Downgrading ", itemToDowngrade.node.name, " to ", newQuality , " to upgrade ", item.node.name)
          downgrades.set(itemToDowngrade, newQuality);
          textureSize += getSize(itemToDowngrade, newQuality) - getSize(item, item.ins.quality.value);
        }
        textureSizeBeforeUpgrades = textureSizeWithDowngrade;
        // otherwise cancel the upgrade
      } else {
      //We are SURE `q != 0` because otherwise it wouldn't have been pushed to the upgrades queue
        upgrades.delete(item);
        textureSize += getSize(item, item.ins.quality.value ) - getSize(item, q);
      }
    }
    const priority_downgrades = downgrades.size - normal_downgrades - hard_downgrades;
    
    /**
     * Apply the changes. 
     * We start with the downgrades in the order they were added
     * Then with the upgrades, starting with the higher-weighted ones
     */
    for(let [model, quality] of [...downgrades.entries(), ...[...upgrades.entries()].reverse()]){
      //We don't want to have too many models loading at once
      if(6 < currently_loading) break;
      const current = model.ins.quality.value;
      if(quality === current) continue;
      const bestMatchDerivative = model.derivatives.select(EDerivativeUsage.Web3D, quality);
      if(bestMatchDerivative && bestMatchDerivative.data.quality != current ){
        model.ins.quality.setValue(bestMatchDerivative.data.quality);
        currently_loading++;
      }
    }

    if(currently_loading != 0 && ENV_DEVELOPMENT){
      const countQ = (q :EDerivativeQuality)=>collection.reduce((s, m)=>(s+((m.model.ins.quality.value === q)?1:0)), 0);
      console.debug(`models quality: [%d, %d, %d, %d]. loading %d models with %d/%d downgrades %s`, 
        countQ(EDerivativeQuality.High),
        countQ(EDerivativeQuality.Medium),
        countQ(EDerivativeQuality.Low),
        countQ(EDerivativeQuality.Thumb),
        currently_loading,
        normal_downgrades,
        hard_downgrades,
        (priority_downgrades != 0?`(${priority_downgrades} priority downgrades)`:"")
      );
      //collection.forEach(c=>console.log(c.model.node.name,c.model.ins.quality.value));
    }
    return 0 < downgrades.size + upgrades.size;
  }
  
  fromData(data: ILOD)
    {
        data = data || {} as ILOD;

        this.ins.copyValues({
            enabled: !!data.enabled,
        });
    }

    toData(): ILOD
    {
        const ins = this.ins;
        const data: Partial<ILOD> = {};

        data.enabled = ins.enabled.value;
        
        return data as ILOD;
    }


}