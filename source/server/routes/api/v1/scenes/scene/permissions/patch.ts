
import { Request, Response } from "express";
import { getUserManager } from "../../../../../../utils/locals";




export default async function patchPermissions(req :Request, res :Response){
  let userManager = getUserManager(req);
  let {scene} = req.params;
  let {username, access} = req.body;
  await userManager.grant(scene, username, access);
  res.status(204).send();
};
