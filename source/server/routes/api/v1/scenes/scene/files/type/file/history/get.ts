
import { Request, Response } from "express";
import toCsv from "../../../../../../../../../utils/csv";
import { getFileParams, getVfs } from "../../../../../../../../../utils/locals";
import { GetFileResult } from "../../../../../../../../../vfs";

export default async function getFileHistory(req :Request, res :Response){
  let vfs = getVfs(req);
  let history = await vfs.getFileHistory(getFileParams(req));

  res.format({
    "application/json":()=>res.status(200).send(history),
    "text/csv": ()=> res.status(200).send(toCsv(history)),
    "text/plain": ()=> res.status(200).send(history.map(r=>`[${r.ctime.toISOString()}] ${r.hash || "REMOVED"} (${r.author})`).join("\n")+"\n"),
  });
};
