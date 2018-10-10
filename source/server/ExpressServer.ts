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

import * as http from "http";

import * as express from "express";
import { Router } from "express";

import * as morgan from "morgan";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as handlebars from "express-handlebars";
import * as session from "express-session";

import uniqueId from "@ff/core/uniqueId";

////////////////////////////////////////////////////////////////////////////////

/** Configuration options for [[ExpressServer]] class */
export interface IExpressServerConfiguration
{
    port?: number;
    enableDevMode?: boolean;
    enableLogging?: boolean;
    staticRoute?: string;
    staticDir?: string;
    viewsDir?: string;
    defaultLayout?: string;
    secret?: string;
    sessionMaxAge?: number;
    sessionSaveUninitialized?: boolean;
    useCompression?: boolean;
}

export default class ExpressServer
{
    static readonly defaultConfiguration: IExpressServerConfiguration = {
        port: 8000,
        enableDevMode: false,
        enableLogging: false,
        staticRoute: "/static",
        sessionMaxAge: 15 * 24 * 3600000, // 2 weeks
        sessionSaveUninitialized: true
    };

    readonly config: IExpressServerConfiguration;
    readonly app: express.Application;
    readonly server: http.Server;

    constructor(config?: IExpressServerConfiguration)
    {
        this.config = Object.assign({}, ExpressServer.defaultConfiguration, config);

        this.app = express();
        this.app.disable('x-powered-by');

        this.server = new http.Server(this.app);

        this.addLogging();
        this.addStaticServer();
        this.addParsing();
        this.addTemplates();
    }

    use(baseRoute: string, router: { router: Router })
    {
        if (router.router) {
            this.app.use(baseRoute, router.router);
        }
    }

    start(): Promise<void>
    {
        this.addErrorHandling();

        const port = this.config.port;

        return new Promise((resolve, reject) => {
            this.server.listen(port, err => {
                if (err) {
                    return reject(new Error(err));
                }

                return resolve();
            });
        });
    }

    protected addLogging()
    {
        // logging middleware
        if (this.config.enableDevMode) {
            this.app.use(morgan("tiny"));
        }
    }

    protected addStaticServer()
    {
        // serve static files
        if (this.config.staticDir) {
            this.app.use(this.config.staticRoute, express.static(this.config.staticDir));
        }
    }

    protected addParsing()
    {
        const app = this.app;

        // parse cookies
        app.use(cookieParser(this.config.secret));

        // parse json and urlencoded request bodies into req.body
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
    }

    protected addSessions()
    {
        const config = this.config;

        if (!config.sessionMaxAge || !config.secret) {
            console.warn("ExpressServer.setupSessions - sessions not enabled");
            return;
        }

        const sessionOptions = {
            name: "sessionId",
            secret: config.secret,
            genid: () => uniqueId(),
            resave: false,
            saveUninitialized: config.sessionSaveUninitialized,
            cookie: {
                maxAge: config.sessionMaxAge,
                httpOnly: true
            }
        };

        this.app.use(session(sessionOptions));
    }

    protected addTemplates()
    {
        // setup handlebars templates
        const viewsDir = this.config.viewsDir;

        if (viewsDir) {
            const app = this.app;
            app.engine(".hbs", handlebars({
                extname: ".hbs",
                layoutsDir: viewsDir + "/layouts",
                defaultLayout: this.config.defaultLayout
            }));
            app.set("view engine", ".hbs");
            app.set("views", viewsDir);
        }
    }

    protected addErrorHandling()
    {
        this.app.use((error, req, res, next) => {

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
    }
}