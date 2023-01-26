
import { getFileParams, getUserId, getVfs } from "../../../utils/locals";
import { Request, Response } from "express";
import { FileType } from "../../../vfs";

export default async function handlePutFile(req :Request, res :Response){
  const vfs = getVfs(req);
  const user_id = getUserId(req);
  const { scene, type, name} = getFileParams(req);
  let r = await vfs.writeFile(req, {user_id, scene, type, name});
  res.status((r.generation === 1)?201:200).send();
};