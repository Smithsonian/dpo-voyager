
import fs from "fs/promises";

import { Request, RequestHandler } from "express";

import { UnauthorizedError } from "../utils/errors";
import User from "./User";

type Group = "anonymous"|"user";
type Privilege = "read"|"write";
type PrivilegeMap = {[pathMatch :string]:Privilege[]};
type GroupPrivileges = {[group in Group]: PrivilegeMap};

/**
 * @see createWebDAV for tests
 */
export default class PrivilegeManager{

  constructor(){}
  
  static readonly defaults :GroupPrivileges = {
    "anonymous": {
      "/api/v1/login": ["read", "write"],
      "/api/v1/logout": ["read", "write"],
      "/scenes.*":["read"],
      "/published.*": ["read"],
      "/api/v1/scenes.*": ["read"]
    },
    "user": {
      "/scenes.*": ["write"],
      "/published.*": ["write"],
      "/api/v1/users/{uid}": ["read", "write"],
      "/api/v1/scenes.*": ["write"]
    },
  }
  /**
   * Does string substitution for bracket-enclosed parameters
   * If a property doesn't match, it is ignored and returned as-is.
   * @example subst("/users/{uid}.json", {uid:"foo"}) => "/users/foo.json"
   * @param str input string
   * @param user values
   * @returns 
   */
  static subst(str :string, user :User){
    return str.replace(/\{[^}]+\}/, (m)=>{
      let value = (user as any)[m.slice(1,-1)];
      if (typeof value === "undefined") return m;
      return value;
    })
  }
  /**
   * 
   * @param fullPath 
   * @param user 
   * @param privilege 
   * @returns 
   */
  _can(fullPath :string, user : User, privilege : Privilege, callback :(err ?:Error)=>any){
    //console.log("Check privilege %s on %s for %s", privilege, fullPath, user);
    let roles = ["anonymous"];
    if(user.isAdministrator) return callback();
    if(!user.isDefaultUser) roles.push("user");
    for(let role of roles){
      let privileges = PrivilegeManager.defaults[role as "anonymous"|"user"];
      for(let [pathMatch, perms] of Object.entries(privileges)){
        if(! new RegExp(`^${PrivilegeManager.subst(pathMatch, user)}$`).test(fullPath.toString())) continue;
        if(perms.some(perm => perm && privilege.indexOf(perm) == 0)){
          return callback();
        }
      }
    }
    //console.log(`${privilege} denied for ${user.username} on ${fullPath}`, resource);
    callback(new UnauthorizedError(`${privilege} denied for ${user.username} on ${fullPath}`));
  }
  can(privilege :Privilege) :RequestHandler{
    return (req, res, next)=>{
      this._can(req.originalUrl, (req.session || User.createDefault()) as User, privilege, next);
    }
  }

  check :RequestHandler= (req, res, next)=>{
    let privilege :Privilege= "write";
    if( ["GET", "HEAD", "PROPFIND"].indexOf(req.method) != -1){
      privilege = "read";
    }
    this._can(req.originalUrl, ((req.session as User).username? req.session : User.createDefault()) as User, privilege, next);
  }
  /**
   * Creates an express middleware to check permissions using app.locals.privilegeManager
   * @param privilege 
   * @returns a middleware to be consumed by express
   */
  static use(privilege ?:Privilege) :RequestHandler{
    return (req, res, next)=>{
      if(!req.app.locals.privilegeManager) return next(new Error("App has no registered privilege manager"));
      req.app.locals.privilegeManager._can(
        req.originalUrl, 
        (req.session || User.createDefault()) as User,
        privilege || (["GET", "HEAD", "PROPFIND"].indexOf(req.method) != -1? "read":"write"), 
        next
      );
    }
  }
}