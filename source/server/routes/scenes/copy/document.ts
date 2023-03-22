import { Request, Response } from "express";
import path from "path";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../../utils/errors";
import { getFileParams, getUserId, getVfs } from "../../../utils/locals";



/**
 * 
 * @see http://www.webdav.org/specs/rfc3253.html#label.header (loosely inspired from)
 */
export default async function handleCopyDocument(req :Request, res :Response){
  let vfs = getVfs(req);
  let user_id = getUserId(req);
  let {scene:ref} = req.params;
  let dest = new URL(req.get("Destination") ?? "", `${req.protocol}://${req.hostname}${req.originalUrl}`);
  let label = Number.parseInt(req.get("Label") as string);
  let withGeneration = Number.isSafeInteger(label) && 0 < label;
  let srcname = path.dirname(req.originalUrl);
  let destname = path.basename(dest.pathname);
  if(!req.get("Destination")) throw new BadRequestError(`Invalid destination header ${req.get("Destination")}`);
  if(path.dirname(dest.pathname) !== path.dirname(req.originalUrl)) throw new BadRequestError(`Source and destination folders do not match`);

  let scene = await vfs.getScene(ref);
  //No need for a transaction as this entry is immutable
  let src = await vfs.getDoc(scene.id, (withGeneration?label:undefined));
  if(!withGeneration && destname === srcname){
    throw new ForbiddenError(`Can't copy a file keeping the same name without providing a label`);
  }
  await vfs.writeDoc(src.data, scene.id, user_id);
  res.format({
    "application/json":()=>res.status(201).send({code: 201, message: "Created"}),
    "text/plain": ()=>res.status(201).send("Created"),
  });
}