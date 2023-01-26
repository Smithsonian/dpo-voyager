import { RequestHandler } from "express";
import User from "../../../auth/User";
import { BadRequestError } from "../../../utils/errors";
import { getUserManager } from "../../../utils/locals";

/**
 * 
 * @type {RequestHandler}
 */
export const postLogin :RequestHandler = (req, res, next)=>{
  let userManager = getUserManager(req);
  let {username,password} = req.body;
  if(!username) throw new BadRequestError("username not provided");
  if(!password) throw new BadRequestError("password not provided");
  userManager.getUserByNamePassword(username, password).then(user=>{
    let safeUser = {
      username: user.username,
      uid: user.uid,
      isDefaultUser: !!user.isDefaultUser,
      isAdministrator: !!user.isAdministrator,
    };
    Object.assign(req.session as any, safeUser);
    res.status(200).send({...safeUser, code: 200, message: "OK"});
  }, next);
};

export const getLogin :RequestHandler = (req, res)=>{
  res.status(200).send(User.safe(req.session as any));
};