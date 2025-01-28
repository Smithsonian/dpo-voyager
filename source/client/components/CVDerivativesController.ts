
import CObject3D, { Node, types } from "@ff/scene/components/CObject3D";
import CScene from "@ff/scene/components/CScene";
import CVModel2 from "./CVModel2";
import CPulse, { IPulseContext, IPulseEvent } from "@ff/graph/components/CPulse";
import Component from "@ff/graph/Component";
import { EAssetType, EDerivativeQuality, EDerivativeUsage } from "client/schema/model";
import CRenderer from "@ff/scene/components/CRenderer";
import { Vector2, Vector3, Box3, Matrix4, Object3D, Quaternion } from "three";
import CTransform from "@ff/scene/components/CTransform";
import CVNode from "./CVNode";
import * as helpers from "@ff/three/helpers";

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

const _ndcBox = new Box3();
const _localBox = new Box3();
const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _quat = new Quaternion();
const _mat4 = new Matrix4();
const _cam_fwd = new Vector3(0, 0, 1);
const _ndc_fwd = new Vector3(0, 0, 1);

/**
 * Dynamic LOD handling. * 
 */
export default class CVDerivativesController extends Component{

  static readonly typeName: string = "CVDerivativesController";
  static readonly isSystemSingleton: boolean = true;

  static readonly text: string = "Derivatives selection";
  static readonly icon: string = "";

  /** Number of frames since last change */
  private _debounce :number = 0;

  private _budget = sizes[EDerivativeQuality.High]*2;

  threshold(q :EDerivativeQuality){
    return this._budget - sizes[q]*2;
  }

  protected static readonly ins = {
    enabled: types.Boolean("Settings.Enabled", true),
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


  setTextureBudget = ()=>{
    // We expect scene performance to always be texture-limited.
    // For example a hundred untextured objects with 25k vertices each would pose absolutely no problem even to a low end mobile device. 
    // However a few 4k maps are enough to overload such a device's GPU and internet connection.
    // First, evaluate raw maximum texture space as an upper bound. This is halved because:
    //  1. we don't particularly want to max-out. This is not a "reasonable", but a "system max supported" value. 
    //  2. This is total available space and any object can have any number of textures (we'd be able to refine this exact number if we wanted)
    //      to which we need to add lightmaps, environment, etc. We just simplify to 1/4 the texture space
    let budget = Math.pow(this.renderer.outs.maxTextureSize.value/2, 2);
    if(typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency < 4){
      console.debug("Reduce budget because of low CPU count");
      budget = budget/2;
    }
    if((navigator as any).userAgentData?.mobile){
      console.debug("Reduce budget because of mobile device");
      budget = budget/1.5; //
    }
    if(typeof (navigator as any).deviceMemory === "number" && (navigator as any).deviceMemory < 8){
      console.debug("Reduce budget because of low RAM");
      budget = Math.min(budget, sizes[EDerivativeQuality.High]*4);
    }
    this._budget = Math.max(sizes[EDerivativeQuality.High]*2, budget);
    console.debug("Performance budget: ", Math.sqrt(this._budget));
  }

  tock(context :IPulseContext) :boolean{
    const cameraComponent = this._scene?.activeCameraComponent;
    if (!this.ins.enabled.value || !cameraComponent) {
        return false;
    }
    if(this._debounce++ < 20){
      return false;
    }
    this._debounce = 0;

    cameraComponent.camera.getWorldDirection(_cam_fwd);

    let currently_loading = 0;
    const weights :Array<[string, any]>= [];
    let collection :Array<ModelDisplayState> = this.getGraphComponents(CVModel2).map(model=>{
      _ndcBox.makeEmpty();

      //We can't just use the model's matrixWorld here because it might not have loaded yet.
      //In this case the bounding box is whatever's defined in the scene file.
      const scale = model.outs.unitScale.value;
      let t :CTransform|CVNode = model.transform;
      _localBox.copy(model.localBoundingBox);
      //_localBox.min.multiplyScalar(scale);
      //_localBox.max.multiplyScalar(scale);
 
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
      //Ideally we use NDC (Normalized Display Coordinates) to compute the perceived size of an object on-screen
      //The thing with NDC is they are crap at representing objects that are on the side of the camera
      //They tends to have infinite (X,Y) sizes that don't make any sense
      //Additionally it's hard to make sense of objects that crosses the camera's cross plane.
      [
        [_localBox.min.x, _localBox.min.y, _localBox.min.z],
        [_localBox.max.x, _localBox.min.y, _localBox.min.z],
        [_localBox.max.x, _localBox.max.y, _localBox.min.z],
        [_localBox.max.x, _localBox.max.y, _localBox.max.z],
        [_localBox.min.x, _localBox.max.y, _localBox.max.z],
        [_localBox.min.x, _localBox.min.y, _localBox.max.z],
        [_localBox.max.x, _localBox.min.y, _localBox.max.z],
        [_localBox.min.x, _localBox.max.y, _localBox.min.z],
      ].forEach((coords:[number, number, number], index)=>{
          _vec3a.set(...coords).project(cameraComponent.camera);
          if(/*cameraComponent.camera.near < _vec3a.z &&*/ _vec3a.z < 1){
            if(Math.abs(_vec3a.x) < 1 && Math.abs(_vec3a.y) < 1){
              clipped = false;
            }
            _ndcBox.expandByPoint(_vec3a);
          }
      });

      cameraComponent.camera.getWorldPosition(_vec3a);
      //Best-case distance
      let distance =  _localBox.distanceToPoint(_vec3a)/cameraComponent.camera.far;
      let angle = 0;
      if(distance != 0){
        _vec3a.set(
          (_ndcBox.min.x < 0 && 0 < _ndcBox.max.x)? 0: Math.min(Math.abs(_ndcBox.max.x), Math.abs(_ndcBox.min.x)),
          (_ndcBox.min.y < 0 && 0 < _ndcBox.max.y)?0: Math.min(Math.abs(_ndcBox.max.y), Math.abs(_ndcBox.min.y)),
          _ndcBox.max.z,
        );
        angle = _vec3a.angleTo(_ndc_fwd);
      }

      //_localBox.getSize(_vec3a);
      _ndcBox.min.clampScalar(-1,1);
      _ndcBox.max.clampScalar(-1,1);
      _ndcBox.getSize(_vec3a);
      let visibleSize = (_vec3a.x *_vec3a.y)/4;
      //let visibleSize = Math.abs((_localBox.max.angleTo(_cam_fwd) - _localBox.min.angleTo(_cam_fwd)))/(cameraComponent.camera.fov*Math.PI/180);

      const depthMod = Math.max(1-distance, 0.1);
      const angleMod = 1 - Math.abs(angle)/Math.PI;

      weights.push([model.ins.name.value, {distance, angle, depthMod, angleMod, visibleSize}]);

      const weight = depthMod*angleMod;

      //Upgrade only here
      let qualityRequest =  model.derivatives.select(EDerivativeUsage.Web3D, getQuality(model.ins.quality.value, visibleSize))?.data.quality;
      if(model.isLoading()) currently_loading++;
      return {model, clipped, weight, qualityRequest} as ModelDisplayState;
    })
    .sort((a, b)=> a.weight - b.weight) //Sort low weights first



    let downgrades = new Map<CVModel2, EDerivativeQuality>();
    /** Separate upgrade path. We compute uprgades first but apply them last */
    let upgrades = new Map<CVModel2, EDerivativeQuality>();
    let textureSize = 0;
    //Now we have a list of  best-fit quality requests.
    //We first compute how much texture space upgrading this would use
    //to know whether or not we'd want to downgrade some models
    let downgradable :ModelDisplayState[] = [];
    for(let item of collection){
      let current_quality = item.model.ins.quality.value;
      if(item.model.isLoading() && current_quality != item.qualityRequest && item.model.activeDerivative){
        // Opportunistically cancel any derivative we no longer want
        // Additionally, set the quality to the current derivative's value
        item.model.ins.quality.setValue(item.model.activeDerivative.data.quality);
        current_quality = item.model.activeDerivative.data.quality;
        currently_loading --;
      }
      
      if(current_quality < item.qualityRequest){
        //Upgrade models as requested
        upgrades.set(item.model, item.qualityRequest);
        current_quality = item.qualityRequest;
      }else if(item.qualityRequest < item.model.ins.quality.value){
        downgradable.push(item);
      }
      textureSize += getSize(item.model, current_quality);
    }

    let overbudget = this._budget <= textureSize;

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
      if( (
        this._budget*2/3 < textureSize
        || 2 <= (downgrades.size+upgrades.size + currently_loading)
        ) && (
          item.clipped
          || item.qualityRequest < item.model.ins.quality.value + 1
        )
      ){
        downgrades.set(item.model, item.qualityRequest);
        textureSize += getSize(item.model, item.qualityRequest) - getSize(item.model, item.model.ins.quality.value);
      }
    }
    let normal_downgrades = downgrades.size;

    /**Agressive downgrades
     * If we are over-budget, blindly downgrade everything that can be until we are not.
    */
    for(let item of downgradable){
      if(textureSize < this._budget ) break;
      if(downgrades.has(item.model)) continue;
      downgrades.set(item.model, item.qualityRequest);
      textureSize += getSize(item.model, item.qualityRequest) - getSize(item.model, item.model.ins.quality.value);
    }
    let hard_downgrades = downgrades.size - normal_downgrades;

    /**"contingency" downgrades. 
     * Downgrade everything starting from the lower weights to one level _below_ what was requested
     * A well-made scene shouldn't get there but we _have_ to be able to handle this
     */
    for(let item of downgradable){
      if(textureSize < this._budget ) break;
      const q = item.model.derivatives.select(EDerivativeUsage.Web3D, Math.max(item.qualityRequest - 1, 0)).data.quality;
      downgrades.set(item.model, q);
      textureSize += getSize(item.model, q) - getSize(item.model, item.model.ins.quality.value);
    }
    
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

    if(currently_loading != 0){
      const countQ = (q :EDerivativeQuality)=>collection.reduce((s, m)=>(s+((m.model.ins.quality.value === q)?1:0)), 0);
      console.debug("%d models are currently loading", currently_loading);
      if(hard_downgrades != downgrades.size){
        console.debug("%d contingency downgrades were needed", downgrades.size - normal_downgrades - hard_downgrades)
      }
      console.debug("%d/%d opportunistic downgrades", normal_downgrades, hard_downgrades);
      console.debug(`models :(%d, %d, %d, %d)`, countQ(EDerivativeQuality.High), countQ(EDerivativeQuality.Medium), countQ(EDerivativeQuality.Low), countQ(EDerivativeQuality.Thumb));
    }
    return 0 < downgrades.size;
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