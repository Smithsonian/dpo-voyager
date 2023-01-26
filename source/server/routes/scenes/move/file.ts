import { Request, Response } from "express";
import path from "path";
import { BadRequestError, ForbiddenError } from "../../../utils/errors";
import { getFileParams, getUserId, getVfs } from "../../../utils/locals";
import { FileType } from "../../../vfs";



/**
 * 
 * @todo does not support Overwrite header but it wouldn't be difficult to implement
 */
export default async function handleMoveFile(req :Request, res :Response){
  let vfs = getVfs(req);
  let user_id = getUserId(req);
  let {name, type, scene} = getFileParams(req);
  let dest = new URL(req.get("Destination") ?? "", `${req.protocol}://${req.hostname}${req.originalUrl}`);
  let destname = path.basename(dest.pathname);
  if(!req.get("Destination")) throw new BadRequestError(`Invalid destination header ${req.get("Destination")}`);
  if(path.dirname(dest.pathname) !== path.dirname(req.originalUrl)) throw new BadRequestError(`Source and destination folders do not match`);
  if(path.basename(dest.pathname) === path.dirname(req.originalUrl)) throw new ForbiddenError(`Can't move a file keeping the same name`);
  await vfs.renameFile({scene, type, name, user_id}, destname);
  res.format({
    "application/json":()=>res.status(201).send({code: 201, message: "Created"}),
    "text/plain": ()=>res.status(201).send("Created"),
  });
}