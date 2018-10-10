/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as sourceMapSupport from "source-map-support";
sourceMapSupport.install();

import * as path from "path";
process.env.NODE_PATH = path.resolve(__dirname, "../shared");
require("module").Module._initPaths();

import ExpressServer, { IExpressServerConfiguration } from "./ExpressServer";

import { IPresentation } from "common/types/presentation";
export interface ITest extends IPresentation {}

import Color from "@ff/core/Color";
const x = new Color();

////////////////////////////////////////////////////////////////////////////////
// GLOBAL SETTINGS

const serverPort = parseInt(process.env["NODE_SERVER_PORT"]) || 8000;
const devMode = process.env.NODE_ENV !== "production";

const rootDir = process.env["NODE_SERVER_ROOT"] || path.resolve(__dirname, "../../..");
const staticDir = path.resolve(rootDir, "static/");
const viewsDir = path.resolve(rootDir, "views/");

////////////////////////////////////////////////////////////////////////////////
// CONFIGURE, START SERVER

console.log([
    "",
    "------------------------------------------",
    "3D Foundation Project - Development Server",
    "------------------------------------------"
].join("\n"));

const expressServerConfig: IExpressServerConfiguration = {
    port: serverPort,
    enableDevMode: devMode,
    staticDir: staticDir,
    staticRoute: "/",
    viewsDir: viewsDir,
    sessionMaxAge: 10 * 365 * 24 * 60 * 60 * 1000, // ten years
    sessionSaveUninitialized: true,
    secret: "7182eb7f4da44a619fc118b57df834ce"
};

const expressServer = new ExpressServer(expressServerConfig);

expressServer.app.get("/:component", (req, res) => {
    res.render("pages/app", { component: req.params.component, devMode });
});

expressServer.start().then(() => {
    console.info(`\nServer ready and listening on port ${serverPort}`);
});
