import { NextFunction, Request, Response, Router } from "express";

import {handlePropfind} from "./propfind";
import {handlePutFile, handlePutDocument} from "./put";
import { canRead, canWrite, isUser } from "../../utils/locals";
import wrap from "../../utils/wrapAsync";
import bodyParser from "body-parser";

import handleGetDocument from "./get/document";
import handleGetFile from "./get/file";
import handleMoveFile from "./move/file";
import handleDeleteFile from "./delete/file";
import { FileTypes } from "../../vfs";
import handleCopyFile from "./copy/file";
import handleCopyDocument from "./copy/document";

/**
 * trivial middleware that ensure req.params.file == req.params.model
 * Shortcut to match only recursive routes like `/foo/foo.svx.json` or `/foo/foo-thumb.png`
 */
function ifFileMatchesScene(req :Request, res :Response, next :NextFunction){
  const {0: file, scene} = req.params;
  if(file !== scene) next("route");
  else next();
}

const router = Router();

router.propfind("/", wrap(handlePropfind));

router.use("/:scene", canRead);
router.propfind("/:scene", wrap(handlePropfind));
router.propfind("/:scene/*", wrap(handlePropfind));


router.get("/:scene/:file(*.svx.json)", wrap(handleGetDocument));
router.put("/:scene/:file(*.svx.json)", 
  canWrite,
  bodyParser.json({type:["application/si-dpo-3d.document+json", "application/json"]}),
  wrap(handlePutDocument)
);
router.copy("/:scene/:file(*.svx.json)", canWrite, wrap(handleCopyDocument));

//Special case for thumbnails that are stored at the root of the scene folder
router.all("/:scene/:file(*.jpg)", (req, res, next)=>{
  let {scene, file} = req.params;
  req.url = `/${scene}/images/${file}`;
  next("route");
});

let types = FileTypes.join("|");

router.get(`/:scene/:type(${types})/:file`, wrap(handleGetFile));
router.put(`/:scene/:type(${types})/:file`, canWrite, wrap(handlePutFile));
router.move(`/:scene/:type(${types})/:file`, canWrite, wrap(handleMoveFile));
router.copy(`/:scene/:type(${types})/:file`, canWrite, wrap(handleCopyFile));
router.delete(`/:scene/:type(${types})/:file`, canWrite, wrap(handleDeleteFile));



//Shouldn't be used as they are created on model copy
router.mkcol(["/:scene/media", "/:scene/media/articles", "/:scene/media/videos"], (req, res)=>res.status(201).send());

export default router;
