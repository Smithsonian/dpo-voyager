
import { getUserId, getVfs } from "../../../utils/locals";
import { Request, Response } from "express";
import { FileType } from "../../../vfs";
import { createHash } from "crypto";


/**
 * @todo use file compression for text assets. Data _should_ be compressed at rest on the server
 */
export default async function handleGetDocument(req :Request, res :Response){
  const vfs = getVfs(req);
  const {scene:scene_name} = req.params;
  let scene = await vfs.getScene(scene_name);
  let f = await vfs.getDoc(scene.id);
  
  let hash = createHash("sha256").update(f.data).digest("base64url");
  let data = Buffer.from(f.data);

  res.set("ETag", `W/${hash}`);
  res.set("Last-Modified", f.mtime.toUTCString());
  if(req.fresh){
    return res.status(304).send("Not Modified");
  }

  res.set("Content-Type", "application/si-dpo-3d.document+json");
  res.set("Content-Length", data.length.toString(10));
  res.status(200).send(data);
};