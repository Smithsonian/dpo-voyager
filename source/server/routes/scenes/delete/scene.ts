
import { getFileParams, getUser, getUserId, getUserManager, getVfs } from "../../../utils/locals";
import { Request, Response } from "express";

export default async function handleDeleteScene(req :Request, res :Response){
  const vfs = getVfs(req);
  let user = getUser(req);
  if(user.isAdministrator && req.query.archive === "false"){
    await vfs.removeScene(req.params.scene);
  }else{
    await vfs.archiveScene(req.params.scene);
  }
  res.status(204).send();
};