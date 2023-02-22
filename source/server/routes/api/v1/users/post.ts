
import { Request, Response } from "express";
import User from "../../../../auth/User";
import UserManager from "../../../../auth/UserManager";
import { BadRequestError } from "../../../../utils/errors";
import { getUserManager } from "../../../../utils/locals";




export default async function postUser(req :Request, res :Response){
  let userManager :UserManager = getUserManager(req);
  //istanbul ignore if
  if(!userManager) throw new Error("Badly configured app : userManager is not defined in app.locals");
  let {username, password, email, isAdministrator=false} = req.body;
  if(!username) throw new BadRequestError("username not provided");
  if(!password) throw new BadRequestError("password not provided");
  if(isAdministrator && typeof isAdministrator !== "boolean") throw new BadRequestError("bad value for admin");
  if(!email) throw new BadRequestError("email not provided");
  let u = await userManager.addUser(username, password, isAdministrator, email);
  res.status(200).send(User.safe(u));
};
