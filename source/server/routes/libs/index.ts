import path from "path";
import fs from "fs/promises";

import express, { Router} from "express";

const router = Router();
const rootDir = path.resolve(__dirname, "../../node_modules");
router.use("/three", express.static(path.join(rootDir, "three/build")));
router.use("/quill", express.static(path.join(rootDir, "quill/dist")));
export default router;
