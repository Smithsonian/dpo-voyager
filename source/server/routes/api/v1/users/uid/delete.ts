
import { Request, Response } from "express";
import User from "../../../../../auth/User";
import UserManager from "../../../../../auth/UserManager";
import { BadRequestError } from "../../../../../utils/errors";
import { getUserId, getUserManager } from "../../../../../utils/locals";




export default async function handleDeleteUser(req :Request, res :Response){
  let userManager :UserManager = getUserManager(req);
  let uid = getUserId(req);
  let targetUid :number = parseInt(req.params.uid as string);
  if(uid == targetUid) throw new BadRequestError("a user can't delete himself");
  await userManager.removeUser(targetUid);
  res.status(204).send();
};
