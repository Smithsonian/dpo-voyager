import fs from "fs/promises";
import { constants } from "fs";
import path from "path";
import { AppLocals, getUserId, getVfs } from "../../../utils/locals";
import uid from "../../../utils/uid";
import { Request, Response } from "express";
import { BadRequestError } from "../../../utils/errors";

/**
 * Special handler for svx files to disallow the upload of invalid JSON.
 * @todo Should check against the official json schema using ajv
 */
export default async function handlePutDocument(req :Request, res :Response){
  const vfs = getVfs(req);
  const uid = getUserId(req);
  const {scene} = req.params;
  let s = JSON.stringify(req.body, null, 2);
  if(s == "{}") throw new BadRequestError(`Invalid json document`);
  await vfs.writeDoc(s, scene, uid);
  res.status(204).send();
};
