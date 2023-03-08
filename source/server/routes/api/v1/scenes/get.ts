
import { createHash } from "crypto";
import { Request, Response } from "express";
import path from "path";
import { HTTPError } from "../../../../utils/errors";
import { getUser, getVfs } from "../../../../utils/locals";
import { wrapFormat } from "../../../../utils/wrapAsync";
import { zip } from "../../../../utils/zip";

export default async function getScenes(req :Request, res :Response){
  let vfs = getVfs(req);
  let u = getUser(req);
  let {id: ids, name: names} = req.query;

  let scenesList = [];
  if(Array.isArray(ids)){
    for(let id of ids){
      if(typeof id !== "string") continue;
      let n = parseInt(id);
      if(Number.isNaN(n)) continue;
      scenesList.push(n);
    }
  }

  if(Array.isArray(names)){
    for(let name of names){
      if(typeof name !== "string") continue;
      scenesList.push(name);
    }
  }else if(typeof names === "string"){
    scenesList.push(names);
  }

  let scenes :Awaited<ReturnType<typeof vfs.getScenes>>;
  if(0 < scenesList.length){
    scenes = await Promise.all(scenesList.map(name=>vfs.getScene(name)));
  }else{
    scenes = await vfs.getScenes(u.isAdministrator?undefined: u.uid);
  }

  let eTag = createHash("sha256")
  let lastModified = 0;
  
  for(let scene of scenes){
    let mtime = scene.mtime.valueOf();
    eTag.update(`${scene.name}:${mtime.toString(32)};`);
    if(lastModified < mtime) lastModified = mtime;
  }

  res.append("Cache-Control", "private");
  res.set("ETag", "W/"+eTag.digest("base64url"));
  res.set("Last-Modified", new Date(lastModified).toUTCString());
  if( req.fresh){
    return res.status(304).send("Not Modified");
  }
  
  await wrapFormat(res, {
    "application/json":()=>res.status(200).send(scenes),

    "text": ()=> res.status(200).send(scenes.map(m=>m.name).join("\n")+"\n"),

    "application/zip": async ()=>{
      async function *getFiles(){
        for(let scene of scenes){
          let root = `scenes/${scene.name}`
          let files = await vfs.listFiles(scene.id, false);
          for(let file of files ){
            let props = await vfs.getFile({scene:scene.id, name: file.name, type: file.type});
            yield {
              ...props,
              filename: path.join("scenes", scene.name, file.type, file.name)
            }
          }
          try{
            let sceneDoc = await vfs.getDoc(scene.id);
            yield {
              filename: `${root}/scene.svx.json`,
              mtime: sceneDoc.mtime,
              stream: [Buffer.from(sceneDoc.data)]
            }
          }catch(e){
            if((e as HTTPError).code != 404) throw e;
            //Ignore errors if scene has no document
          }
        }
      }

      res.set("Content-Disposition", `attachment; filename="scenes.zip"`);
      //FIXME : it would be possible to compute content-length ahead of time 
      // but we need to take into account the size of all zip headers
      // It would also allow for strong ETag generation, which would be desirable
      res.status(200);
      for await (let data of zip(getFiles())){
        await new Promise<void>(resolve=>{
          let again = res.write(data);
          if(again) resolve();
          else res.once("drain", resolve);
        });
      }
      res.end();
    }
  });
};
