
import { getUserId, getVfs } from "../../../../../utils/locals";
import { Request, Response } from "express";
import { parse_glb } from "../../../../../utils/glTF";



async function getDocument(scene:string, filepath:string){
  let {default:orig} = await import("../../../../../utils/documents/default.svx.json");
  //dumb inefficient Deep copy because we want to mutate the doc in-place
  let document = JSON.parse(JSON.stringify(orig));
  let meta = await parse_glb(filepath);
  let mesh = meta.meshes[0]; //Take the first mesh for its name
  document.nodes.push({
    "name": mesh?.name ?? scene,
    "model": 0,
    "meta": 0
  } as any);
  document.scenes[0].nodes.push(document.nodes.length -1);

  document.models = [{
    "units": "mm",
    "boundingBox": meta.bounds,
    "derivatives":[{
      "usage": "Web3D",
      "quality": "Highest",
      "assets": [
        {
          "uri": `models/${scene}.glb`,
          "type": "Model",
          "byteSize": meta.byteSize,
          "numFaces": meta.meshes.reduce((acc, m)=> acc+m.numFaces, 0),
          "imageSize": 8192
        }
      ]
    }],
    "annotations":[],
  }];
  document.metas = [{
    "collection": {
      "titles": {
        "EN": scene,
        "FR": scene,
      }
    },
  }]
  return document
}

/**
 * Tries to create a scene.
 * has consistency problems : a scene could get created without its associated 3D object
 * Whether or not it's desired behaviour remains to be defined
 */
export default async function postScene(req :Request, res :Response){
  let vfs = getVfs(req);
  let user_id = getUserId(req);
  let {scene} = req.params;
  let scene_id = await vfs.createScene(scene, user_id);
  try{
    let f = await vfs.writeFile(req, {user_id, scene: scene,  mime:"model/gltf-binary", name: `models/${scene}.glb`});
    let document = await getDocument(scene, vfs.filepath(f));
    await vfs.writeDoc(JSON.stringify(document), scene_id, user_id);
  }catch(e){
    //If written, the file will stay as a loose object but will get cleaned-up later
    await vfs.removeScene(scene_id).catch(e=>console.warn(e));
    throw e;
  }
  res.status(201).send({code: 201, message: "created scene with id :"+scene_id});
};
