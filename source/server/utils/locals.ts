
import { NextFunction, Request, RequestHandler, Response } from "express";
import {basename, dirname} from "path";
import User, { SafeUser } from "../auth/User";
import UserManager, { AccessType, AccessTypes } from "../auth/UserManager";
import Vfs, { GetFileParams } from "../vfs";
import { BadRequestError, ForbiddenError, HTTPError, InternalError, UnauthorizedError } from "./errors";

export interface AppLocals extends Record<string, any>{
  port :number;
  fileDir :string;
  userManager :UserManager;
  vfs :Vfs;
}

/**
 * @throws {InternalError} if app.locals.userManager is not defined for this request
 */
export function getUserManager(req :Request) :UserManager {
  let userManager :UserManager = (req.app.locals as AppLocals).userManager;
  //istanbul ignore if
  if(!userManager) throw new InternalError("Badly configured app : userManager is not defined in app.locals");
  return userManager
}

export function getFileDir(req :Request) :string{
  let fileDir = (req.app.locals as AppLocals).fileDir;
  if(!fileDir) throw new InternalError("Badly ocnfigured app : fileDir is not a valid string");
  return fileDir;
}

export function isUser(req: Request, res:Response, next :NextFunction){
  res.append("Cache-Control", "private");
  
  if((req.session as User).uid ) next();
  else next(new UnauthorizedError());
}

/**
 * Special case to allow user creation if no user exists in the database
 */
export function isAdministratorOrOpen(req: Request, res:Response, next :NextFunction){
  isAdministrator(req, res, (err)=>{
    if(!err) return next();
    Promise.resolve().then(async ()=>{
      let userManager = getUserManager(req);
      let users = (await userManager.getUsers());
      if(users.length == 0) return;
      else throw err;
    }).then(()=>next(), next);
  });
}

export function isAdministrator(req: Request, res:Response, next :NextFunction){
  res.append("Cache-Control", "private");
  
  if((req.session as User).isAdministrator) next();
  else next(new UnauthorizedError());
}

/**
 * Generic internal permissions check
 */
function _perms(check:number,req :Request, res :Response, next :NextFunction){
  let {scene} = req.params;
  let {isAdministrator=false, uid = 0} = (req.session ??{})as SafeUser;
  if(!scene) throw new BadRequestError("no scene parameter in this request");
  if(check < 0 || AccessTypes.length <= check) throw new InternalError(`Bad permission level : ${check}`);

  res.append("Cache-Control", "private");

  if(isAdministrator) return next();
  
  let userManager = getUserManager(req);
  (res.locals.access? Promise.resolve(res.locals.access):
    userManager.getAccessRights(scene, uid).then(a=>{ res.locals.access = a; return a })
  ).then( access => {
    if(check <= AccessTypes.indexOf(access)) next();
    else next(new UnauthorizedError(`user does not have ${AccessTypes[check]} rights on ${scene}`));
  }, next);
}

/**
 * Check user read access over a scene
 */
export const canRead = _perms.bind(null, AccessTypes.indexOf("read"));
/**
 * Check user write access over a scene
 */
export const canWrite = _perms.bind(null, AccessTypes.indexOf("write"));
/**
 * Check user administrative access over a scene
 */
export const canAdmin = _perms.bind(null, AccessTypes.indexOf("admin"));

export function getUser(req :Request){
  return {
    username: "default",
    uid: 0,
    isAdministrator:false,
    ...req.session,
  } as SafeUser;
}

export function getUserId(req :Request){
  return getUser(req).uid;
}

export function getFileParams(req :Request):GetFileParams{
  let {scene, name} = req.params;
  if(!scene) throw new BadRequestError(`Scene parameter not provided`);
  if(!name) throw new BadRequestError(`File parameter not provided`);

  return {scene, name};
}

export function getVfs(req :Request){
  let vfs :Vfs = (req.app.locals as AppLocals).vfs;
  //istanbul ignore if
  if(!vfs) throw new InternalError("Badly configured app : vfs is not defined in app.locals");
  return vfs;
}

export function getHost(req :Request) :URL{
  let host = (req.app.get("trust proxy")? req.get("X-Forwarded-Host") : null) ?? req.get("Host");
  return new URL(`${req.protocol}://${host}`);
}