import { createHmac } from "crypto";
import { Request, RequestHandler, Response } from "express";
import User from "../../../auth/User";
import { BadRequestError, ForbiddenError } from "../../../utils/errors";
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

export async function getLogin(req :Request, res:Response){
  let {payload, sig, redirect} = req.query;
  if(typeof payload !== "string" || !payload || !sig){
    return res.status(200).send(User.safe(req.session as any));
  }

  let userManager = getUserManager(req);

  let keys = (await userManager.getKeys());

  if(!keys.some((key)=>{
    return createHmac("sha512", key).update(payload as string).digest("base64url") === sig;
  })){
    throw new ForbiddenError();
  }

  let user;
  try{
    let s = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    user = await userManager.getUserByName(s.username);
    if(user.uid != s.uid) throw new Error("uid mismatch");
    if(new Date(s.expires).valueOf() < new Date().valueOf()) throw new Error("Token expired");
  }catch(e){
    console.log((e as any).message);
    throw new BadRequestError(`Failed to parse login payload`);
  }
  Object.assign(req.session as any, User.safe(user));
  if(redirect && typeof redirect === "string"){
    return res.redirect(302, redirect );
  }
  res.status(204).send();
};

export async function getLoginLink(req :Request, res :Response){
  let {username} = req.params;
  let userManager = getUserManager(req);
  let user = await userManager.getUserByName(username);
  let key = (await userManager.getKeys())[0];

  let payload = Buffer.from(JSON.stringify({
    uid: user.uid.toString(10),
    username: username,
    expires: new Date(Date.now()+ 1000*60*60*24*30).toISOString(), //1 month
  })).toString("base64url");

  let sig = createHmac("sha512", key).update(payload).digest("base64url");
  res.format({
    "text/plain":()=>{
      let host = (req.app.get("trust proxy")? req.get("X-Forwarded-Host") : null) ?? req.get("Host");
      let rootUrl = new URL(`${req.protocol}://${host}`);
      rootUrl.pathname = "/api/v1/login";
      rootUrl.searchParams.set("payload", payload);
      rootUrl.searchParams.set("sig", sig);
      rootUrl.searchParams.set("redirect", "/");
      res.status(200).send(rootUrl.toString());
    },
    "application/json":()=>{
      res.status(200).send({payload, sig});
    }
  })
}