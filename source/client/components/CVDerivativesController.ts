
import CObject3D, { Node, types } from "@ff/scene/components/CObject3D";
import CScene from "@ff/scene/components/CScene";
import CVModel2 from "./CVModel2";
import CPulse, { IPulseContext, IPulseEvent } from "@ff/graph/components/CPulse";
import Component from "@ff/graph/Component";
import { EDerivativeQuality, EDerivativeUsage } from "client/schema/model";
import CRenderer from "@ff/scene/components/CRenderer";
import { Vector2, Vector3, Box3, Matrix4, Object3D } from "three";
import CTransform from "@ff/scene/components/CTransform";
import CVNode from "./CVNode";

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


function isOnScreen(b :Box3) :boolean{
  return Math.min(Math.abs(b.max.x), Math.abs(b.min.x)) < 1 && Math.min(Math.abs(b.max.y), Math.abs(b.min.y)) < 1;
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

/**
 * Due to the nature of NDC coordinates, size on the (x, y, 0) plane would be infinite
 * Simply clamp it for now.
 */
function clampSize(size :number){
  return Math.min(size, 2);
}

const _ndcBox = new Box3();
const _localBox = new Box3();
const _vec3a = new Vector3();
const _mat4 = new Matrix4();
const _cam_fwd = new Vector3(0, 0, 1);

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

    let changes = 0; //We don't want to start too many upgrades at once
    const weights :Array<[string, any]>= [];
    let models :Array<{model:CVModel2, size:number, clipped: boolean, quality:EDerivativeQuality, weight: number}> = this.getGraphComponents(CVModel2).map(model=>{
      _ndcBox.makeEmpty();

      //We can't just use the model's matrixWorld here because it might not have loaded yet.
      //In this case the bounding box is whatever's defined in the scene file.
      const scale = model.outs.unitScale.value;
      let t :CTransform|CVNode = model.transform;
      _localBox.copy(model.localBoundingBox);
      _localBox.min.multiplyScalar(scale);
      _localBox.max.multiplyScalar(scale);
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
          if(cameraComponent.camera.near < _vec3a.z && _vec3a.z < 1){
            if(Math.abs(_vec3a.x) < 1 && Math.abs(_vec3a.y) < 1){
              clipped = false;
            }
            _ndcBox.expandByPoint(_vec3a);
          }
      });

      _localBox.getCenter(_vec3a);
      const distance = _vec3a.distanceTo(cameraComponent.camera.position)/cameraComponent.camera.far;
      const angle = _vec3a.angleTo(_cam_fwd);

      _localBox.getSize(_vec3a);
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
      let quality =  Math.max(model.ins.quality.value, getQuality(model.ins.quality.value, visibleSize));

      return {model, size:visibleSize, clipped, weight, quality};
    })
    .sort((a, b)=> a.weight - b.weight); //Models that have a high difference between their size and weight are the first to get downgraded






    /** @fixme : ideally, cancel anything that is in-glight and no longer needed */

    //Now we have a list of upgrade-only quality requests.
    //We need to know whether or not we'd want to downgrade some models
    let textureSize = models.reduce((size, {quality})=>size + sizes[quality], 0);
    let clippedOnly = true, idx = 0, downgrades = 0, hidden = 0, passes=1;

    while(this._budget < textureSize){
      const model = models[idx];
      if(model.clipped || !clippedOnly){
        let q = getQuality(model.model.ins.quality.value, model.size);
        if( q < model.quality){
          textureSize = textureSize - sizes[model.quality] + sizes[q];
          model.quality = q;
          if(!model.clipped) downgrades++;
        }
      }
      if(models.length <= ++idx){
        passes++;
        for(let model of models){
          //Here it is important to decide _how_ models size is to be changed
          //It affects which models will be downgraded first
          model.size = model.size*model.weight;
        }
        if(passes == 1)console.debug("%d downgrades after first pass", downgrades);
        if(model.quality == EDerivativeQuality.Thumb) break; // Prevent infinite loop
        clippedOnly = false;
        idx = 0;
      }
    }

    let loading = models.reduce((s,m)=>s+(m.model.isLoading()?1:0),0);
    for(let i = 0; i < models.length; i++){
      if(5 < loading) break;
      const  {model, quality} = models[i];
      const current = model.ins.quality.value;

      if(quality === current) continue;
      const bestMatchDerivative = model.derivatives.select(EDerivativeUsage.Web3D, quality);
      if(bestMatchDerivative && bestMatchDerivative.data.quality != current ){
        if(current < bestMatchDerivative.data.quality && 2 < (++changes)){continue;}
        /** @fixme should prevent having too many loading models at once because that creates network contention */
        //console.debug("Set quality for ", model.ins.name.value, " from ", current, " to ", bestMatchDerivative.data.quality);
        model.ins.quality.setValue(bestMatchDerivative.data.quality);
      }
    }


    if(0 < changes){
      this._debounce = 0;
      let notClipped = models.filter(m=>!m.clipped);
      let byDistance = weights.sort(([, a],[, b])=> a.distance - b.distance).slice(0);
      let byAngle = weights.sort(([, a],[, b])=> a.angle - b.angle).reverse().slice(0, 4);
      let byVsize = weights.sort(([, a],[, b])=> a.visibleSize - b.visibleSize).reverse().slice(0, 4);

      // console.debug("Centered : ", byAngle.map(m=>`${m[0]} (${m[1].angleMod})`).join(", "));
      // console.debug("Visible : \n\t", notClipped.map(m=>m.model.ins.name.value).join("\n\t"))
      //console.log("VSize : ", byVsize[0][1].visibleSize, byVsize.map(m=>m[0]).join(", "));
  

      const countQ = (q :EDerivativeQuality)=>models.reduce((s, m)=>(s+((m.quality=== q)?1:0)), 0);
      console.debug(`models :(%d, %d, %d, %d)`, countQ(EDerivativeQuality.High), countQ(EDerivativeQuality.Medium), countQ(EDerivativeQuality.Low), countQ(EDerivativeQuality.Thumb));
      //console.debug(`%d/%d clipped models, %d hidden, %d downgraded in %d downgrade passes`, models.reduce((s,m)=>s+(m.clipped?1:0), 0), models.length, hidden, downgrades, passes);
      //console.debug("High quality models : ", models.filter((m)=>m.quality ===EDerivativeQuality.High).map(m=>m.model.ins.name.value).join(", "))
    }
    // We could refine our "pixel budget" here by getting the actual number of maps loaded on each model
    return 0 < changes;
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