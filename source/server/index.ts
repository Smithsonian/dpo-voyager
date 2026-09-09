/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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
import * as https from "https";
import * as fs from "fs";

import { pipeline } from "stream/promises";

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

////////////////////////////////////////////////////////////////////////////////
// FILE SERVER
//
// GET and PUT of the file directory are handled here; the WebDAV server below serves everything
// else. Both are registered first so they see a request before it does.

/** Resolves a request path inside the file directory, or null if it escapes it. */
function resolveFilePath(pathname: string): string {
    let relative: string;
    try {
        relative = decodeURIComponent(pathname).replace(/[\\/]+/g, "/");
    }
    catch (error) {
        return null; // malformed percent-encoding
    }

    if (relative.indexOf("\0") !== -1) {
        return null;
    }

    const fullPath = path.join(fileDir, relative);
    if (fullPath !== fileDir && !fullPath.startsWith(fileDir + path.sep)) {
        return null;
    }

    return fullPath;
}

/**
 * Strong entity-tag for a file, from its size and modification time — the validator express
 * computes for static files, minus the `W/` that marks it weak. `If-Match` requires strong
 * comparison (RFC 9110 13.1.1), so a weak tag would leave every write unconditional.
 */
function fileEtag(stats): string {
    return `"${stats.size.toString(16)}-${stats.mtime.getTime().toString(16)}"`;
}

async function statOrNull(fullPath: string) {
    try {
        return await fs.promises.stat(fullPath);
    }
    catch (error) {
        if (error.code === "ENOENT") {
            return null;
        }
        throw error;
    }
}

/**
 * Conditional PUT, which WebDAV's does not do:
 *
 *  - no `If-Match`, or one that matches -- written; `201` if new, `204` if it replaced
 *    something, carrying the entity-tag of what is now stored
 *  - an `If-Match` that does not match  -- `412`, and nothing is written
 */
async function handlePut(req, res, next) {
    if (req.method !== "PUT") {
        return next();
    }

    const fullPath = resolveFilePath(req.path);
    if (!fullPath) {
        return res.sendStatus(400);
    }

    const stats = await statOrNull(fullPath);
    if (stats && !stats.isFile()) {
        return res.status(405).send("not a file");
    }

    const ifMatch = req.get("If-Match");
    if (ifMatch !== undefined) {
        const current = stats ? fileEtag(stats) : null;
        const matched = ifMatch.trim() === "*"
            ? !!current
            : !!current && ifMatch.split(",").some(tag => tag.trim() === current);

        if (!matched) {
            if (current) {
                res.set("ETag", current);
            }
            return res.status(412).send(`'${req.path}' has changed since it was read`);
        }
    }

    // WebDAV answers 409 for a missing parent collection, which collides with the 409 a client
    // reads as "could not reconcile". Create the folder instead.
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });

    // write beside the target and rename over it, so a failed upload can't truncate the file
    const tempPath = `${fullPath}.${process.pid}.tmp`;
    try {
        await pipeline(req, fs.createWriteStream(tempPath));
        await fs.promises.rename(tempPath, fullPath);
    }
    catch (error) {
        await fs.promises.rm(tempPath, { force: true });
        throw error;
    }

    res.set("ETag", fileEtag(await fs.promises.stat(fullPath)));
    res.status(stats ? 204 : 201).end();
}

app.use(handlePut);

// Reads. Supplies the entity-tag a write quotes back, and brings range requests and `304`
// handling with it. Directories fall through to WebDAV, so listings still work.
app.use(express.static(fileDir, {
    etag: false,
    index: false,
    redirect: false,
    setHeaders: (res, filePath, stats) => res.setHeader("ETag", fileEtag(stats)),
}));

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

        const validator = function(req, res, next) {

            if (!resolveFilePath(req.path)) {
                return res.sendStatus(400);
            }

            next();
        };

        app.use(validator, webdav.extensions.express("/", webDAVServer));
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

// HTTPS Server Option
/*const options = {
  key: fs.readFileSync('./services/server/bin/key.pem'),
  cert: fs.readFileSync('./services/server/bin/cert.pem')
};

https.createServer(options, app).listen(port, () => {
    console.info(`Server ready and listening on port ${port}\n`);
});*/

// HTTP Server
const server = new http.Server(app);
server.listen(port, () => {
    console.info(`Server ready and listening on port ${port}\n`);
});
