
import { Request, Response } from "express";
import path from "path";
import { getUser, getUserId, getVfs } from "../../../../utils/locals";
import { wrapFormat } from "../../../../utils/wrapAsync";
import { zip } from "../../../../utils/zip";

export default async function getScenes(req :Request, res :Response){
  let vfs = getVfs(req);
  let u = getUser(req);
  let scenes = await vfs.getScenes(u.isAdministrator?undefined: u.uid);

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
          let sceneDoc = await vfs.getDoc(scene.id);
          yield {
            filename: `${root}/scene.svx.json`,
            mtime: sceneDoc.mtime,
            stream: [Buffer.from(sceneDoc.data)]
          }
        }
      }
      res.set("Content-Disposition", `attachment; filename="scenes.zip`);
      //FIXME : it would be possible to compute content-length ahead of time 
      // but we need to take into account the size of all zip headers
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
