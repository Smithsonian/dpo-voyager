
import { Request, Response } from "express";
import path from "path";
import { getVfs } from "../../../../../utils/locals";
import { wrapFormat } from "../../../../../utils/wrapAsync";
import { asyncMap, zip } from "../../../../../utils/zip";
import { FileProps, FileType, GetFileResult } from "../../../../../vfs";




export default async function getScene(req :Request, res :Response){
  let vfs = getVfs(req);
  let {scene} = req.params;
  let {id} = await vfs.getScene(scene);
  await wrapFormat(res, {
    "application/json": async ()=>{
      let doc = await vfs.getDoc(id);
      res.status(200).send(doc);
    },
    "application/zip": async ()=>{
      
      async function *getFiles(){
        let files = (await vfs.listFiles(id, false))
        .filter(f=>f.hash);
        yield {
          filename: `${scene}/`,
          isDirectory: true,
          mtime: files.reduce((mtime, file)=> {
            if(file.mtime.valueOf() < mtime.valueOf() ) return mtime;
            else return file.mtime;       
          }, new Date(0))
        }
        yield {
          filename: `${scene}/media/`,
          isDirectory: true,
          mtime: files.reduce((mtime, file)=> {
            if(["images","articles"].indexOf(file.type) == -1) return mtime; 
            if(file.mtime.valueOf() < mtime.valueOf() ) return mtime;
            else return file.mtime;       
          }, new Date(0))
        }
        yield {
          filename: `${scene}/media/images/`,
          isDirectory: true,
          mtime: files.reduce((mtime, file)=> {
            if(file.type == "images") return mtime; 
            if(file.mtime.valueOf() < mtime.valueOf() ) return mtime;
            else return file.mtime;       
          }, new Date(0))
        }
        yield {
          filename: `${scene}/media/articles/`,
          isDirectory: true,
          mtime: files.reduce((mtime, file)=> {
            if(file.type == "articles") return mtime; 
            if(file.mtime.valueOf() < mtime.valueOf() ) return mtime;
            else return file.mtime;       
          }, new Date(0))
        }
        for(let file of files){
          let f = await vfs.getFile({scene: id, name: file.name, type: file.type});
          yield {
            filename: path.join(scene, f.type, f.name),
            mtime: f.mtime,
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
