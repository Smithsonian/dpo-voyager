import { Request, Response } from "express";
import path from "path";
import { BadRequestError, ForbiddenError } from "../../../utils/errors";
import { getFileParams, getUserId, getVfs } from "../../../utils/locals";


/**
 * 
 * @todo does not support Overwrite header
 */
export default async function handleMoveFile(req :Request, res :Response){
  let vfs = getVfs(req);
  let user_id = getUserId(req);
  let {name, scene} = getFileParams(req);
  let dest = new URL(req.get("Destination") ?? "", `${req.protocol}://${req.hostname}${req.originalUrl}`);
  if(!req.get("Destination")) throw new BadRequestError(`Invalid destination header ${req.get("Destination")}`);
  if(!dest.pathname.startsWith(`/scenes/${scene}/`)) throw new BadRequestError(`Source and destination scenes do not match: from ${dest.pathname.split("/")[2]} to ${scene}`);
  if(dest.pathname ==  req.originalUrl ) throw new ForbiddenError(`Can't move a file keeping the same name`);
  console.log("rename from %s to %s", name, dest.pathname.slice(`/scenes/${scene}/`.length) );
  await vfs.renameFile({scene, name, user_id}, dest.pathname.slice(`/scenes/${scene}/`.length));
  res.format({
    "application/json":()=>res.status(201).send({code: 201, message: "Created"}),
    "text/plain": ()=>res.status(201).send("Created"),
  });
}
