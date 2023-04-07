
import { getFileParams, getUserId, getVfs } from "../../../utils/locals";
import { Request, Response } from "express";
import path from "path";

function getMimeType(name:string){
  let ext = path.extname(name).toLowerCase();
  if(!ext || 5 < ext.length) return "application/octet-stream";
  if(ext == ".jpg" || ext == ".jpeg") return "image/jpeg";
  if(ext == ".png") return "image/png";
  if(ext == ".webp") return "image/webp";
  if(ext == ".mp4") return "video/mp4";
  if(ext == ".htm" || ext == ".html") return "text/html";
  if(ext == ".txt") return "text/plain";
  return "application/octet-stream";
}

function getContentType(req :Request){
  return  req.is([
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "text/html",
    "application/json",
  ]) || "application/octet-stream";
}


export default async function handlePutFile(req :Request, res :Response){
  const vfs = getVfs(req);
  const user_id = getUserId(req);
  const { scene, name} = getFileParams(req);
  //If content-type can be inferred from the file's extension it's always better than the header
  // In particular because of https://github.com/Smithsonian/dpo-voyager/issues/202
  let mime = getMimeType(name);
  if(mime == "application/octet-stream"){
    mime = getContentType(req);
  }
  let r = await vfs.writeFile(req, {user_id, scene, name, mime });
  res.status((r.generation === 1)?201:200).send("Created");
};
