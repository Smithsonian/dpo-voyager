import ref from "./default.svx.json";

import {IDocument, INode, IScene} from "../../../client/schema/document"
import { IAsset, IBoundingBox, IDerivative, IModel, TDerivativeQuality, TDerivativeUsage } from "../../../client/schema/model";

export interface Document extends IDocument{
  scenes:IScene[];
  models: IModel[];
}
export interface Asset{
  name :string;
  uri :string;
  usage :TDerivativeUsage;
  quality :TDerivativeQuality;
  bounds ?:IBoundingBox;
  byteSize ?:number;
  numFaces ?:number;
}

export function copyDocument(source ?:Document){
  //Dumb deep copy
  return JSON.parse(JSON.stringify(source ??ref)) as Document;
}

export function addModel(asset:Asset, source?:Document|IDocument){
  if(typeof source ==="undefined") source = ref as any as IDocument;

  let model :IModel = {
    "units": "mm",
    "boundingBox": asset.bounds,
    "derivatives":[],
    "annotations":[],
  };
  let node :INode = {
    "name": asset.name,
    "model": source.models?.length || 0,
    "meta": 0
  };
  let scene = {
    ...((source.scenes as any)[0]),
    nodes: [...((source.scenes as any)[0].nodes), source.nodes?.length ?? 0]
  }
  return addDerivative(asset, {
    ...source,
    models: [...(source.models || []), model],
    nodes: [...(source.nodes as []), node],
    scenes: [scene]
  });
}

/**
 * Adds a model derivative to a document
 * If the document has no model, automatically switch to `addModel()` to create one.
 * @see {addModel}
 */
export function addDerivative(asset:Asset, source?:Document) :Document{
  if(typeof source ==="undefined" || !Array.isArray(source?.models)) return addModel(asset, source);
  let derivatives :IDerivative[] = source.models[0].derivatives.filter(d=>!d.assets.find(a=>a.uri == asset.uri));
  derivatives.push({
    "usage": asset.usage,
    "quality": asset.quality,
    "assets": [
      Object.assign(
        { "uri": asset.uri, "type": "Model",}, 
        asset.byteSize?{byteSize: asset.byteSize}:{}, 
        asset.numFaces?{numFaces:asset.numFaces}:{}
      ) as IAsset,
    ]
  });
  return {
    ...source,
    models: [{
      ...source.models[0],
      derivatives,
    }]
  }
}