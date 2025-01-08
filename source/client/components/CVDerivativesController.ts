
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

    cameraComponent.camera.getWorldDirection(_cam_fwd);

    let loading = 0;
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
      let qualityRequest =  getQuality(model.ins.quality.value, visibleSize);
      if(model.isLoading()) loading++;
      return {model, clipped, weight, qualityRequest} as ModelDisplayState;
    })
    .sort((a, b)=> a.weight - b.weight) //Sort low weights first



    let changes = new Map<CVModel2, EDerivativeQuality>();
    let upgrades = new Map<CVModel2, EDerivativeQuality>();
    let textureSize = 0;
    //Now we have a list of  best-fit quality requests.
    //We first compute how much texture space upgrading this would use
    //to know whether or not we'd want to downgrade some models
    let downgradable = [];
    for(let item of collection){
      let quality = item.model.ins.quality.value;
      if(item.model.isLoading() && item.model.ins.quality.value != item.qualityRequest){
        //Opportunistically cancel any derivative we no longer want
        changes.set(item.model, item.qualityRequest);
        quality = item.qualityRequest;
        if(item.model.activeDerivative && item.model.activeDerivative.data.quality == item.qualityRequest) loading--;
      }else if(item.model.ins.quality.value < item.qualityRequest){
        //Upgrade models as requested
        upgrades.set(item.model, item.qualityRequest);
        quality = item.qualityRequest;
      }else if(item.model.ins.quality.value != 0){
        downgradable.push(item);
      }
      textureSize += getSize(item.model, quality);
    }

    for(let item of downgradable){
      //We don't want to overload the system
      // but once we don't have too much going on, we want to keep on downgrading clipped assets
      if(textureSize < this._budget*2/3 && 6 <= changes.size) break;
      if(!item.clipped) continue;
      if(item.model.ins.quality.value < item.qualityRequest) continue;
      changes.set(item.model, item.qualityRequest);
      textureSize += getSize(item.model, item.qualityRequest) - getSize(item.model, item.model.ins.quality.value);
    }

    for(let item of downgradable){
      let overbudget = this._budget <= textureSize;
      //We are much less agressive with assets that are in-view
      // We downgrade only if 2 levels above request or we are over budget
      if(item.qualityRequest < item.model.ins.quality.value + (overbudget? 0: -1)) continue;
      changes.set(item.model, item.qualityRequest);
      textureSize += getSize(item.model, item.qualityRequest) - getSize(item.model, item.model.ins.quality.value);
    }

    for(let item of downgradable){
      //This is "contingency mode". 
      //A well-made scene shouldn't get there but we _have_ to be able to handle this
      if(textureSize < this._budget ) break;
      changes.set(item.model, Math.max(item.qualityRequest-1, 0));
      textureSize += getSize(item.model, item.qualityRequest-1) - getSize(item.model, item.model.ins.quality.value);
    }
    
    for(let [model, quality] of [...changes.entries(), ...upgrades.entries()]){
      if(6 < loading) break;
      const current = model.ins.quality.value;
      if(quality === current) continue;
      const bestMatchDerivative = model.derivatives.select(EDerivativeUsage.Web3D, quality);
      if(bestMatchDerivative && bestMatchDerivative.data.quality != current ){
        /** @fixme should prevent having too many loading models at once because that creates network contention */
        //console.debug("Set quality for ", model.ins.name.value, " from ", current, " to ", bestMatchDerivative.data.quality);
        model.ins.quality.setValue(bestMatchDerivative.data.quality);
        loading++;
      }
    }

    if(0 < changes.size){
      this._debounce = 0;
      const countQ = (q :EDerivativeQuality)=>collection.reduce((s, m)=>(s+((m.model.ins.quality.value === q)?1:0)), 0);
      console.debug("%d models are currently loading", loading);
      console.debug(`models :(%d, %d, %d, %d)`, countQ(EDerivativeQuality.High), countQ(EDerivativeQuality.Medium), countQ(EDerivativeQuality.Low), countQ(EDerivativeQuality.Thumb));
    }
    return 0 < changes.size;
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