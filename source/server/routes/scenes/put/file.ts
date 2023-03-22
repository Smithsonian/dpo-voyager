
import { getFileParams, getUserId, getVfs } from "../../../utils/locals";
import { Request, Response } from "express";
import path from "path";

function getContentType(name:string){
  if(/\.jpe?g$/i.test(name)) return "image/jpeg";
  if(/\.png$/i.test(name)) return "image/png";
  if(/\.webp$/i.test(name)) return "image/webp";
  if(/\.html$/.test(name)) return "text/html";
  return "application/octet-stream";
}


export default async function handlePutFile(req :Request, res :Response){
  const vfs = getVfs(req);
  const user_id = getUserId(req);
  const { scene, name} = getFileParams(req);
  let mime = req.get("Content-Type");
  if(!mime || mime == "application/octet-stream") mime = getContentType(name);

  let r = await vfs.writeFile(req, {user_id, scene, name});
  res.status((r.generation === 1)?201:200).send();
};
