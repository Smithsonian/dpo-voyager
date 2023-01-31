'use strict';

import { Request, RequestHandler, Response, NextFunction } from "express";

interface AsyncRequestHandler{
  (
    req: Request,
    res:  Response,
  ) :Promise<any>;
};
/**
 * Wraps an async function to pass errors to next()
 * It's slightly convoluted to try to keep a proper name to the handler.
 * A simpler version would be `return (req, res next)=>handler(req, res).catch(next);`
 * @returns 
 */
export default function wrap(handler :AsyncRequestHandler):RequestHandler {
  let name = (typeof handler.prototype =="object")? handler.name: "anonymousHandler";
  return new Function(
    "handler",
    `return function ${name} (req, res, next) { Promise.resolve(handler(req, res)).catch(next)};`
  )(handler);
}

/**
 * Asynchronous wrapper around Response.format().
 * @see Response.format()
 * 
 * Additionally, allows the use of req.query.format for unambiguous cases
 */
export async function wrapFormat(res :Response, handlers :Record<string,()=>Promise<any>|any>) :Promise<any>{
  let p :()=>Promise<void>;
  let {format} = res.req.query;
  switch(format){
    case "zip":
      if(handlers["application/zip"]) return await handlers["application/zip"]();
    case "json":
      if(handlers["application/json"]) return await handlers["application/json"]();
    case "text":
      if(handlers["text/plain"]) return await handlers["text/plain"]();
  }
  res.format(Object.entries(handlers).reduce((h, [type, handler])=>{
    return {...h, [type]:()=>{
      p = handler;
    }}
  }, {}));
  //@ts-ignore (we know p will be assigned in res.format)
  return await p();
}