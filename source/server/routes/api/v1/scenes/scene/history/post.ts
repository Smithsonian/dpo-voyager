import { Request, Response } from "express";
import { BadRequestError } from "../../../../../../utils/errors";
import { getUser, getVfs } from "../../../../../../utils/locals";
import { ItemEntry } from "../../../../../../vfs";


/**
 * Restore a scene's history to just after some point. 
 * 
 * What is "before" or "after" is defined by the reverse of what is returned by `GET /api/v1/scenes/:scene/history`
 * That is the algorithm will keep everything in :
 *  history[0] .. history[indexOf(:id)]
 *  
 * @see {getSceneHistory} 
 */
export async function postSceneHistory(req :Request, res :Response){
  let requester = getUser(req);
  let {scene:sceneName, id: idString} = req.params;
  let id = Number.parseInt(idString);
  if(Number.isNaN(id)) throw new BadRequestError(`Invalid file ID : ${idString}`);
  let files :Map<string, ItemEntry> = new Map();

  await getVfs(req).isolate(async (tr)=>{
    let scene = await tr.getScene(sceneName);
    let history = await tr.getSceneHistory(scene.id);
    let index = history.findIndex((item)=> item.id === id);

    if(index === -1) throw new BadRequestError(`No file found in ${sceneName} with id ${idString}`);

    let refs = history.slice(index);
    files = new Map(history.slice(0, index).map(item=>([`${item.type}/${item.name}`, item])));

    for(let file of files.values()){
      //Find which version of the file needs to be restored :
      let prev = refs.find((ref)=> ref.name === file.name && (("type" in file)? ("type" in ref && ref.type === file.type) : true));
      if(file.type !== "documents"){
        let theFile = (prev? await tr.getFileById(prev.id): {hash: null, size: 0});
        await tr.createFile({scene: scene.id, name: file.name, type: file.type as any, user_id: (prev? prev.author_id : requester.uid) }, theFile );
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
    changes: files.size,
  });
}