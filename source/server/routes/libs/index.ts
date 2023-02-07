import path from "path";

import express, { Router} from "express";

const router = Router();
const libsDir =  path.join(process.cwd(), "node_modules");
router.use("/three", express.static(path.join(libsDir, "three/build")));
router.use("/quill", express.static(path.join(libsDir, "quill/dist")));
export default router;
