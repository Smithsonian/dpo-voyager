
import { Request, Response } from "express";
import { getVfs } from "../../../../../../utils/locals";


export default async function getSceneHistory(req :Request, res :Response){
  let vfs = getVfs(req);
  let {scene:sceneName} = req.params;
  let scene = await vfs.getScene(sceneName);
  let documents = await vfs.getSceneHistory(scene.id);
  res.format({
    "application/json":()=>res.status(200).send(documents),
    "text": ()=> res.status(200).send(documents.map(doc =>`${doc.name}#${doc.generation}`).join("\n")+"\n"),
  });
};
