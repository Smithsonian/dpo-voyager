import { Request, Response } from "express";
import path from "path";
import { BadRequestError } from "../../../../../../utils/errors";
import { getUser, getVfs } from "../../../../../../utils/locals";
import { ItemEntry } from "../../../../../../vfs";


/**
 * Restore a scene's history to just after some point. 
 * 
 * What is "before" or "after" is defined by the reverse of what is returned by `GET /api/v1/scenes/:scene/history`
 * That is the algorithm will remove everything in indices :
 *  history[0] .. history[indexOf(:id)]
 *  
 * @see {getSceneHistory} 
 */
export async function postSceneHistory(req :Request, res :Response){
  let requester = getUser(req);
  let {scene:sceneName} = req.params;
  let {name, generation, type, id } = req.body;
  let files :Map<string, ItemEntry> = new Map();
  if(name && !type ) type = ((name == "scene.svx.json")? "document":"file");
  if(!( (typeof id === "number" && ["document", "file"].indexOf(type) != -1 ) 
    ||  (typeof name === "string" && typeof generation === "number")
  )) throw new BadRequestError(`History restoration requires either of "name" and "generation" or "id" and "type" or "name" to be set`);
  await getVfs(req).isolate(async (tr)=>{
    let scene = await tr.getScene(sceneName);
    let history = await tr.getSceneHistory(scene.id);
    
    let index = history.findIndex((item)=> {
      return ((type === "document")?item.mime == "application/si-dpo-3d.document+json" : item.mime !== "application/si-dpo-3d.document+json")
        &&   ((id)? item.id == id : item.name == name && item.generation == generation)
    });

    if(index === -1) throw new BadRequestError(`No file found in ${sceneName} matching ${(id? type+"#"+id : name+"#"+generation)}`);
    let refs = history.slice(index);
    files = new Map(history.slice(0, index).map(item=>([`${item.name}`, item])));
    for(let file of files.values()){
      //Find which version of the file needs to be restored :
      let prev = refs.find((ref)=> ref.name === file.name && ref.mime === file.mime);
      if(file.mime !== "application/si-dpo-3d.document+json"){
        let theFile = (prev? await tr.getFileById(prev.id): {hash: null, size: 0});
        await tr.createFile({scene: scene.id, name: file.name, user_id: (prev? prev.author_id : requester.uid) }, theFile )
      }else if(typeof prev === "undefined"){
        throw new BadRequestError(`Trying to remove scene document for ${sceneName}. This would create an invalid scene`);
      }else{
        let {data} = await tr.getDocById(prev.id);
        await tr.writeDoc(data, scene.id, prev.author_id );
      }
    }
  });

  res.status(200).send({
    code: 200,
    message: `${files.size} files changed`,
    changes: Object.fromEntries(files),
  });
}