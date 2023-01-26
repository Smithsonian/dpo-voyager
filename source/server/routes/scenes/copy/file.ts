import { Request, Response } from "express";
import path from "path";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../../utils/errors";
import { getFileParams, getUserId, getVfs } from "../../../utils/locals";
import { FileType } from "../../../vfs";



/**
 * 
 * @see http://www.webdav.org/specs/rfc3253.html#label.header (loosely inspired from)
 */
export default async function handleCopyFile(req :Request, res :Response){
  let vfs = getVfs(req);
  let user_id = getUserId(req);
  let {name, scene, type} = getFileParams(req);
  let dest = new URL(req.get("Destination") ?? "", `${req.protocol}://${req.hostname}${req.originalUrl}`);
  let label = req.get("Label");
  let srcname = path.dirname(req.originalUrl);
  let destname = path.basename(dest.pathname);
  if(!req.get("Destination")) throw new BadRequestError(`Invalid destination header ${req.get("Destination")}`);
  if(path.dirname(dest.pathname) !== path.dirname(req.originalUrl)) throw new BadRequestError(`Source and destination folders do not match`);

  //No need for a transaction as this entry is immutable
  let versions = await vfs.getFileHistory({scene, type, name});
  if(!versions[0].hash && !label){
    throw new NotFoundError(`Can't copy a removed file`);
  }else if((!label || versions[0].hash == label) && destname === srcname){
    throw new ForbiddenError(`Can't copy a file keeping the same name without providing a label`);
  }
  let src = (label?versions.find((v)=> v.hash === label):versions[0]);
  if(!src){
    throw new NotFoundError(`Couldn't find a file matching ${scene}/${type}/${name}#${label}`);
  }
  await vfs.createFile({scene, type, name:destname, user_id}, {hash: src.hash, size: src.size});
  res.format({
    "application/json":()=>res.status(201).send({code: 201, message: "Created"}),
    "text/plain": ()=>res.status(201).send("Created"),
  });
}