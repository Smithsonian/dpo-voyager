/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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
import * as http from "http";

import * as express from "express";
import * as morgan from "morgan";
import { v2 as webdav } from "webdav-server";

////////////////////////////////////////////////////////////////////////////////
// CONFIGURATION

const port: number = parseInt(process.env["VOYAGER_SERVER_PORT"]) || 8000;
const devMode: boolean = process.env["NODE_ENV"] !== "production";

const rootDir = path.resolve(__dirname, "../../..");
const staticDir = path.resolve(rootDir, "dist/");
const fileDir = path.resolve(rootDir, "files/");
const docDir = path.resolve(rootDir, "docs/_site/");

////////////////////////////////////////////////////////////////////////////////
// GREETING

console.log(`
  _________       .__  __  .__                        .__                ________ ________   
 /   _____/ _____ |__|/  |_|  |__   __________   ____ |__|____    ____   \\_____  \\\\______ \\  
 \\_____  \\ /     \\|  \\   __\\  |  \\ /  ___/  _ \\ /    \\|  \\__  \\  /    \\    _(__  < |    |  \\ 
 /        \\  Y Y  \\  ||  | |   Y  \\\\___ (  <_> )   |  \\  |/ __ \\|   |  \\  /       \\|    \`   \\
/_______  /__|_|  /__||__| |___|  /____  >____/|___|  /__(____  /___|  / /______  /_______  /
        \\/      \\/              \\/     \\/           \\/        \\/     \\/         \\/        \\/ 
------------------------------------------------------
Smithsonian 3D Foundation Project - Development Server
------------------------------------------------------
Port:                    ${port}
Development Mode:        ${devMode}
Root Directory:          ${rootDir}
Static File Directory:   ${staticDir}
WebDAV File Directory:   ${fileDir}
Documentation Directory: ${docDir}
------------------------------------------------------
`);

////////////////////////////////////////////////////////////////////////////////

const app = express();
app.disable('x-powered-by');

// logging
if (devMode) {
    app.use(morgan("tiny"));
}

// static file server
app.use("/", express.static(staticDir));

// documentation server
app.use("/doc", express.static(docDir));

// WebDAV file server
const webDAVServer = new webdav.WebDAVServer();
webDAVServer.setFileSystem("/", new webdav.PhysicalFileSystem(fileDir), success => {
    if (!success) {
        console.error(`failed to mount WebDAV file system at '${fileDir}'`);
    }
    else {
        webDAVServer.afterRequest((req, next) => {
            // Display the method, the URI, the returned status code and the returned message
            //console.log(`WebDAV ${req.request.method} ${req.request.url} ` +
            //    `${req.response.statusCode} ${req.response.statusMessage}`);
            next();
        });

        app.use(webdav.extensions.express("/", webDAVServer));
    }
});

// error handling
app.use((error, req, res, next) => {
    console.error(error);

    if (res.headersSent) {
        return next(error);
    }

    if (req.accepts("json")) {
        // send JSON formatted error
        res.status(500).send({ error: `${error.name}: ${error.message}` });
    }
    else {
        // send error page
        res.status(500).render("errors/500", { error });
    }
});

const server = new http.Server(app);
server.listen(port, () => {
    console.info(`Server ready and listening on port ${port}\n`);
});