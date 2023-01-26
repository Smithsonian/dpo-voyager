
import { Request, Response } from "express";
import toCsv from "../../../../../../../../../utils/csv";
import { getVfs } from "../../../../../../../../../utils/locals";
import { FileType, GetFileResult } from "../../../../../../../../../vfs";

export default async function getFileHistory(req :Request, res :Response){
  let vfs = getVfs(req);
  let { scene, file, type} = req.params;
  let history = await vfs.getFileHistory({scene, type: type as FileType, name: file});

  res.format({
    "application/json":()=>res.status(200).send(history),
    "text/csv": ()=> res.status(200).send(toCsv(history)),
    "text/plain": ()=> res.status(200).send(history.map(r=>`[${r.ctime.toISOString()}] ${r.hash || "REMOVED"} (${r.author})`).join("\n")+"\n"),
  });
};
