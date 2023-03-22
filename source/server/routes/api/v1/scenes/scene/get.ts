
import { Request, Response } from "express";
import path from "path";
import { getVfs } from "../../../../../utils/locals";
import { wrapFormat } from "../../../../../utils/wrapAsync";
import { zip } from "../../../../../utils/zip";




export default async function getScene(req :Request, res :Response){
  let vfs = getVfs(req);
  let {scene} = req.params;
  let {id, mtime} = await vfs.getScene(scene);
  await wrapFormat(res, {
    "application/json": async ()=>{
      let doc = await vfs.getDoc(id);
      res.status(200).send(doc);
    },
    "application/zip": async ()=>{
      
      async function *getFiles(){
        let folders = await vfs.listFolders(id);
        let files = (await vfs.listFiles(id, false, true))
        .filter(f=>f.hash);

        yield {
          filename: `${scene}/`,
          isDirectory: true,
          mtime,
        }

        for(let file of files){
          let f = await vfs.getFile({scene: id, name: file.name});
          yield {
            filename: path.join(scene, f.name),
            mtime: f.mtime,
            folder: f.mime == "text/directory",
            stream: f.stream,
          }
        }
      }
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
