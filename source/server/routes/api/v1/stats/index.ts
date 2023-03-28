import { Request, Response } from "express";
import { getVfs } from "../../../../utils/locals";



export default async function handleGetStats(req :Request, res :Response){
  let vfs = getVfs(req);
  let stats = await vfs.getStats();
  res.status(200)
  res.format({
    "application/json": ()=>{
      res.send(stats);
    },
    "text/plain": ()=>{
      res.send(Object.entries(stats).map(([section, values])=>{
        return `[${section}] `+ Object.entries(values).map(([k, v])=>`${k}: ${v}`).join(", ");
      }).join("\n"));
    }
  })
}