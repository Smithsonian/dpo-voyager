import { Request, Response } from "express";
import { getFileParams, getUser, getVfs } from "../../utils/locals";




export default async function handleMkcol(req :Request, res :Response){
  let vfs = getVfs(req);
  let requester = getUser(req);
  let {scene, name} = getFileParams(req);
  await vfs.createFolder({scene, name, user_id: requester.uid });
  res.status(201).send("Created");
}