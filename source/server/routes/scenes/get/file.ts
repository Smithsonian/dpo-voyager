
import { getFileParams, getUserId, getVfs } from "../../../utils/locals";
import { Request, Response } from "express";
import { FileType } from "../../../vfs";

function getContentType(type:FileType, name:string){
  if(type == "images") {
    if(/\.jpe?g$/i.test(name)) return "image/jpeg";
    if(/\.png$/i.test(name)) return "image/png";
    if(/\.webp$/i.test(name)) return "image/webp";
  }
  if(type == "articles"){
      return /\.html$/.test(name)?"text/html" : "text/plain";
  }
  return "application/octet-stream";
}

/**
 * @todo use file compression for text assets. Data _should_ be compressed at rest on the server
 */
export default async function handleGetFile(req :Request, res :Response){
  const vfs = getVfs(req);
  const {scene, type, name} = getFileParams(req);
  let f = await vfs.getFile({ scene, type, name: name });

  res.set("ETag", `W/${f.hash}`);
  res.set("Last-Modified", f.mtime.toUTCString());
  if(req.fresh){
    f.stream.destroy();
    return res.status(304).send("Not Modified");
  }
  
  res.set("Content-Type", getContentType(type, name));
  res.set("Content-Length", f.size.toString(10));
  res.status(200);
  for await (let d of f.stream){
    res.write(d);
  }
  res.end();
};