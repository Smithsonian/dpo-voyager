
import { Request, Response } from "express";
import path from "path";
import { getVfs } from "../../../../utils/locals";
import { wrapFormat } from "../../../../utils/wrapAsync";
import { zip } from "../../../../utils/zip";

export default async function getScenes(req :Request, res :Response){
  let vfs = getVfs(req);
  let scenes = await vfs.getScenes();

  await wrapFormat(res, {
    "application/json":()=>res.status(200).send(scenes),

    "text": ()=> res.status(200).send(scenes.map(m=>m.name).join("\n")+"\n"),

    "application/zip": async ()=>{
      async function *getFiles(){
        let index = [];
        for(let scene of scenes){
          let root = `scenes/${encodeURIComponent(scene.name)}`
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
          let doc = JSON.parse(sceneDoc.data);
          let metas = doc.metas[ doc.scenes[0].meta ?? 0];
          if(!metas){
            metas = {};
            console.warn(`can't find metas for ${scene.name} at index ${doc.scenes[0].meta ?? 0}`);
            console.log("Metas :",doc.metas);
          }
          let title = metas.collection?.titles?.FR ?? metas.collection?.title;
          if(!title){
            title = scene.name;
            console.warn(`can't find title in scene ${scene.name}`);
          }
          let thumbnail = (await vfs.listFiles(scene.id, false)).find(f=>/-image-thumb\.jpg$/i.test(f.name))?.name;
          if(!thumbnail) console.warn("No thumbnails in ", scene.name);
          else{
            thumbnail = `${root}/images/${thumbnail}`;
          }
          index.push({
            root: `${root}/`, 
            document:`scene.svx.json`, 
            title,
            thumbnail
          })
        }
        yield {
          filename: "documents.json",
          mtime: new Date(),
          stream: [Buffer.from(JSON.stringify({documents: index}, null, 2))],
        };
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
