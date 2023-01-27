
import { getFileParams, getUserId, getVfs } from "../../../utils/locals";
import { Request, Response } from "express";
import Vfs, { FileType } from "../../../vfs";
import { HTTPError } from "../../../utils/errors";
import { addDerivative, Asset } from "../../../utils/documents/edit";
import path from "path";
import { parse_glb } from "../../../utils/glTF";


function getAssetParams(req :Request){
  const { type, name} = getFileParams(req);
  let ext = path.extname(name).toLowerCase();
  let usage :Asset["usage"] = "Web3D";
  let quality :Asset["quality"] = "Highest";
  let size = parseInt(req.get("Content-Length") as any);
  switch(ext){
    case ".usdz":
      usage = "iOSApp3D";
      quality = "AR";
      break;
  }

  let asset :Asset = {
    name,
    uri: `${type}/${name}`,
    usage,
    quality,
    byteSize: (Number.isSafeInteger(size)?size: undefined)
  }
  return asset;
}

export default async function handlePutFile(req :Request, res :Response){
  const vfs = getVfs(req);
  const user_id = getUserId(req);
  const { scene, type, name} = getFileParams(req);
  let r = await vfs.writeFile(req, {user_id, scene, type, name});
  if(type =="models"){
    let asset = getAssetParams(req);
    if(name.toLowerCase().endsWith(".glb")){
      try{
        let meta = await parse_glb(vfs.filepath(r));
        asset.name = meta.meshes[0].name ?? scene as string;
        asset.bounds = meta.bounds;
        asset.byteSize = meta.byteSize;
        asset.numFaces = meta.meshes[0].numFaces
      }catch(e){
        console.warn("Failed to parse GLB file : ", e);
      }
    }
    await registerModel(vfs, scene, asset);
  }
  res.status((r.generation === 1)?201:200).send();
};

async function registerModel(vfs :Vfs, sceneNameOrId: string|number, asset :Asset){
  let scene = await vfs.getScene(sceneNameOrId);
  let doc;
  try{
    let docProps = await vfs.getDoc(scene.id);
    doc = JSON.parse(docProps.data);
    /** @fixme use proper ajv validation */
    if(!Array.isArray(doc.nodes)) throw new SyntaxError("Bad document structure");
  }catch(e){
    if((e as HTTPError).code === 404 || e instanceof SyntaxError){
      doc = (await import("../../../utils/documents/default.svx.json")).default;
    }else throw e;
  }
  await vfs.writeDoc(JSON.stringify(addDerivative(asset, doc)), scene.id);
}