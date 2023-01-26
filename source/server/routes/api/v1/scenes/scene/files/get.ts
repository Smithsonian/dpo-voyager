
import { Request, Response } from "express";
import toCsv from "../../../../../../utils/csv";
import { getVfs } from "../../../../../../utils/locals";
import { FileType, GetFileResult } from "../../../../../../vfs";



export default async function getFiles(req :Request, res :Response){
  let vfs = getVfs(req);
  let {scene} = req.params;
  let {id} = await vfs.getScene(scene);
  let files = await vfs.listFiles(id);

  res.format({
    "application/json":()=>res.status(200).send(files),
    "text/csv": ()=> res.status(200).send(toCsv(files)),
    "text/plain": ()=> res.status(200).send(files.map(f=>`${f.name}: ${f.hash || "REMOVED"} <${f.author}>`).join("\n")+"\n"),
  });
};
