
import path from "path";
import { Router } from "express";
import User from "../../../auth/User";
import UserManager from "../../../auth/UserManager";
import { BadRequestError } from "../../../utils/errors";
import { canAdmin, canRead, getUserManager, isAdministrator, isAdministratorOrOpen, isUser } from "../../../utils/locals";
import wrap from "../../../utils/wrapAsync";
import bodyParser from "body-parser";
import { getLogin, getLoginLink, sendLoginLink, postLogin } from "./login";
import { postLogout } from "./logout";
import postScene from "./scenes/scene/post";
import getScenes from "./scenes/get";
import getSceneHistory from "./scenes/scene/history/get";
import getFiles from "./scenes/scene/files/get";
import getFileHistory from "./scenes/scene/files/type/file/history/get";

import getScene from "./scenes/scene/get";
import getPermissions from "./scenes/scene/permissions/get";
import patchPermissions from "./scenes/scene/permissions/patch";
import postUser from "./users/post";
import handleDeleteUser from "./users/uid/delete";
import { handlePatchUser } from "./users/uid/patch";
import { postSceneHistory } from "./scenes/scene/history/post";
import handleGetStats from "./stats";



const router = Router();

/** Configure cache behaviour for the whole API
 * Settings can be changed individually further down the line
 */
router.use((req, res, next)=>{
  //Browser should always make the request
  res.set("Cache-Control", "max-age=0, must-revalidate");
  next();
})

router.get("/stats", isAdministrator, wrap(handleGetStats));

router.use("/login", (req, res, next)=>{
  res.append("Cache-Control", "private");
  next();
});
router.get("/login", wrap(getLogin));
router.post("/login", bodyParser.json(), postLogin);
router.get("/login/:username/link", isAdministrator, wrap(getLoginLink));
router.post("/login/:username/link", wrap(sendLoginLink));
router.post("/logout", postLogout);


router.get("/users", isAdministrator, wrap(async (req, res)=>{
  let userManager :UserManager = getUserManager(req);
  //istanbul ignore if
  if(!userManager) throw new Error("Badly configured app : userManager is not defined in app.locals");
  let users = await userManager.getUsers(true);
  res.status(200).send(users);
}));

router.post("/users", isAdministratorOrOpen, bodyParser.json(), wrap(postUser));
router.delete("/users/:uid", isAdministrator, wrap(handleDeleteUser));
router.patch("/users/:uid", bodyParser.json(), wrap(handlePatchUser));

router.get("/scenes", wrap(getScenes));
router.post("/scenes/:scene", isUser, wrap(postScene));

router.use("/scenes/:scene", canRead);
router.get("/scenes/:scene/history", wrap(getSceneHistory));
router.post("/scenes/:scene/history", bodyParser.json(), wrap(postSceneHistory));
router.get("/scenes/:scene", wrap(getScene));
router.get("/scenes/:scene/files", wrap(getFiles));
router.get("/scenes/:scene/files/:type(articles|images|models)/:file/history", wrap(getFileHistory));
router.get("/scenes/:scene/permissions", wrap(getPermissions));
router.patch("/scenes/:scene/permissions", canAdmin, bodyParser.json(), wrap(patchPermissions));

export default router;
