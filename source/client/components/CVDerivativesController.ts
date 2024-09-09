
import CObject3D, { Node, types } from "@ff/scene/components/CObject3D";
import CScene from "@ff/scene/components/CScene";
import CVModel2 from "./CVModel2";
import CPulse, { IPulseContext, IPulseEvent } from "@ff/graph/components/CPulse";
import Component from "@ff/graph/Component";
import { EDerivativeQuality, EDerivativeUsage } from "client/schema/model";
import CRenderer from "@ff/scene/components/CRenderer";
import { Vector2, Vector3, Box3, Matrix4 } from "three";
import CTransform from "@ff/scene/components/CTransform";
import CVNode from "./CVNode";

interface ILOD{
  enabled?:boolean;
}

/**
 * Applies a modifier depending on the model's center position on screen
 * Models near the center of screen are considered more important than near corners
 * A coefficient of 0.5 means a model whose center is right at the edge of the screen
 * is half as important as a centered model of equal size
 * @fixme using min/max might be more pertinent 
 * Don't go below 25% of original weight
 */
function centerWeight(pt :Vector2|Vector3){
    return Math.sqrt(Math.max(1 - 0.5*Math.abs(pt.x) - 0.5*Math.abs(pt.y), 1/16));
}

/**
 * How far from center is the centermost part of the object?
 * dxy = 0: Object crosses the image's center
 * dxy = 1 object's nearest point would be just outside screen space if located on the X or Y axis
 * dxy = 2: Object's nearest border is just beyond the screen's diagonal edge
 * We add X offset and Y offset because we kind of _want_ diagonals to be underweighted,
 * though a 1:1 addition might be a bit too much.
 */
function maxCenterWeight(b :Box3){
    let dxy = Math.max(-b.max.x, b.min.x, 0) + Math.max(-b.max.y, b.min.y, 0);
    return 1 / (1+dxy);
}

/**
 * Applies a modifier using Z depth
 * Keep in mind that actual depth decay is already accounted-for naturally through screen-space coordinates
 * 
 */
function depthWeight(min:number, max:number){
    if(max < -1 || 1 < min ) return 0;
    //Actual depth when within near/far bounds is already accounted-for
    //through NDC projection. We could however implement some kind of exponential decay here
    if(-1 < min && max < 1 ) return 1;
    return 1 - 2/(Math.max(1,max-1) - Math.min(-1, min+1));
}
/**
 * Due to the nature of NDC coordinates, size on the (x, y, 0) plane would be infinite
 * Simply clamp it for now.
 */
function clampSize(size :number){
  return Math.min(size, 1);
}


const _ndcBox = new Box3();
const _localBox = new Box3();
const _vec3a = new Vector3();
const _mat4 = new Matrix4();

/**
 * Dynamic LOD handling. * 
 */
export default class CVDerivativesController extends Component{

  static readonly typeName: string = "CVDerivativesController";
  static readonly isSystemSingleton: boolean = true;

  static readonly text: string = "Derivatives selection";
  static readonly icon: string = "";

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
  }


  tock(context :IPulseContext) :boolean{
    const cameraComponent = this._scene?.activeCameraComponent;
    if (!this.ins.enabled.value || !cameraComponent) {
        return false;
    }
    let changed = false;
    const models :Array<{model:CVModel2, relSize:number, weight: number}> = this.getGraphComponents(CVModel2).map(model=>{
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
      //Translate to normalized device coordinates
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
          _ndcBox.expandByPoint(_vec3a);
      });
      _ndcBox.getSize(_vec3a);
      const relSize = (_vec3a.x *_vec3a.y)/4;

      const weight = clampSize(relSize)*maxCenterWeight(_ndcBox)*depthWeight(_ndcBox.min.z, _ndcBox.max.z);
      return {model, relSize, weight};
    })
    .sort((a, b)=> b.weight - a.weight);

    for(let i = 0; i < models.length; i++){
      const  {model, relSize, weight} = models[i];
      const current = model.ins.quality.value;
      let quality = EDerivativeQuality.Thumb;
      if(i < 2){
        quality = EDerivativeQuality.High;
      }else if(i < 5){
        quality = EDerivativeQuality.Medium;
      }else if(i < 10){
        quality = EDerivativeQuality.Low;
      }
      /** @fixme completely unload models that are way out of view */

      if(quality === current) continue;
      const bestMatchDerivative = model.derivatives.select(EDerivativeUsage.Web3D, quality);
      if(bestMatchDerivative && bestMatchDerivative.data.quality != current ){
        //console.debug("Set quality for ", model.ins.name.value, " from ", current, " to ", bestMatchDerivative.data.quality);
        model.ins.quality.setValue(bestMatchDerivative.data.quality);
        changed = true;
      }
    }
    return changed;
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