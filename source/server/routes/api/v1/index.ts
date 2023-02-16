
import path from "path";
import { Router } from "express";
import User from "../../../auth/User";
import UserManager from "../../../auth/UserManager";
import { BadRequestError } from "../../../utils/errors";
import { canAdmin, canRead, getUserManager, isAdministrator, isUser } from "../../../utils/locals";
import wrap from "../../../utils/wrapAsync";
import bodyParser from "body-parser";
import { getLogin, getLoginLink, postLogin } from "./login";
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

const router = Router();

router.get("/login", wrap(getLogin));
router.post("/login", bodyParser.json(), postLogin);
router.get("/login/:username/link", isAdministrator, wrap(getLoginLink));
router.post("/logout", postLogout);


router.get("/users", isAdministrator, wrap(async (req, res)=>{
  let userManager :UserManager = getUserManager(req);
  //istanbul ignore if
  if(!userManager) throw new Error("Badly configured app : userManager is not defined in app.locals");
  let users = await userManager.getUsers(true);
  res.status(200).send(users);
}));

router.post("/users", isAdministrator, bodyParser.json(), wrap(postUser));
router.delete("/users/:uid", isAdministrator, wrap(handleDeleteUser));

router.get("/scenes", wrap(getScenes));
router.post("/scenes/:scene", isUser, wrap(postScene));

router.use("/scenes/:scene", canRead);
router.get("/scenes/:scene/history", wrap(getSceneHistory));
router.get("/scenes/:scene", wrap(getScene));
router.get("/scenes/:scene/files", wrap(getFiles));
router.get("/scenes/:scene/files/:type(articles|images|models)/:file/history", wrap(getFileHistory));
router.get("/scenes/:scene/permissions", wrap(getPermissions));
router.patch("/scenes/:scene/permissions", canAdmin, bodyParser.json(), wrap(patchPermissions));

export default router;
