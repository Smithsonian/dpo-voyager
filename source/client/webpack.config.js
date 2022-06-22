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

////////////////////////////////////////////////////////////////////////////////
//
// Environment variables used
//
// NODE_ENV               development | production
// VOYAGER_OFFLINE        True for an offline build (no external dependencies)
// VOYAGER_ANALYTICS_ID   Google Analytics ID
//
////////////////////////////////////////////////////////////////////////////////


"use strict";

require('dotenv').config();

const fs = require("fs-extra");
const path = require("path");
const childProcess = require("child_process");
const webpack = require("webpack");

const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CSSMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HTMLWebpackPlugin = require("html-webpack-plugin");

////////////////////////////////////////////////////////////////////////////////

const project = path.resolve(__dirname, "../..");

const dirs = {
    project,
    source: path.resolve(project, "source"),
    assets: path.resolve(project, "assets"),
    output: path.resolve(project, "dist"),
    modules: path.resolve(project, "node_modules"),
    libs: path.resolve(project, "libs"),
};

const apps = {
    "explorer": {
        name: "voyager-explorer",
        entryPoint: "client/ui/explorer/MainView.ts",
        title: "Voyager Explorer",
        template: "explorer.hbs",
    },
    "mini": {
        name: "voyager-mini",
        entryPoint: "client/ui/mini/MainView.ts",
        title: "Voyager Mini",
        template: "explorer.hbs",
    },
    "launcher": {
        name: "voyager-launcher",
        entryPoint: "client/ui/launcher/MainView.ts",
        title: "Voyager Launcher",
        template: "explorer.hbs",
    },
    "story": {
        name: "voyager-story",
        entryPoint: "client/ui/story/MainView.ts",
        title: "Voyager Story",
        template: "story.hbs",
    },
};

const version = childProcess.execSync("git describe --tags").toString().trim();
const analyticsId = process.env["VOYAGER_ANALYTICS_ID"];

////////////////////////////////////////////////////////////////////////////////

module.exports = function(env, argv)
{
    const appKey = env.app || "explorer";
    const isDevMode = argv.mode !== undefined ? argv.mode !== "production" : process.env["NODE_ENV"] !== "production";
    const isOffline = argv.offline !== undefined ? true : process.env["VOYAGER_OFFLINE"] === "true";

    // copy static assets and license files
    fs.copy(dirs.assets, dirs.output, { overwrite: true });
    fs.copy(path.resolve(dirs.project, "LICENSE.md"), path.resolve(dirs.output, "LICENSE.md"), { overwrite: true });
    fs.copy(path.resolve(dirs.project, "3RD_PARTY_LICENSES.txt"), path.resolve(dirs.output, "3RD_PARTY_LICENSES.txt"), { overwrite: true });

    if (appKey === "all") {
        return [
            createAppConfig(apps.explorer, isDevMode, isOffline),
            createAppConfig(apps.mini, isDevMode, isOffline),
            createAppConfig(apps.launcher, isDevMode, isOffline),
            createAppConfig(apps.story, isDevMode, isOffline),
        ];
    }
    else if (apps[appKey]) {
        return createAppConfig(apps[appKey], isDevMode, isOffline);
    }
    else {
        throw new Error(`can't build, app '${appKey}' not found.`);
    }
};

function createAppConfig(app, isDevMode, isOffline)
{
    const devMode = isDevMode ? "development" : "production";
    const localTag = isOffline ? "-offline" : "";
    const appName = app.name;
    const appTitle = `${app.title} ${version} ${isDevMode ? " DEV" : " PROD"}`;

    console.log("\nVOYAGER - WEBPACK BUILD SCRIPT");
    console.log("  application = %s", appName);
    console.log("  mode = %s", devMode);
    console.log("  offline = %s", isOffline);
    console.log("  version = %s", version);
    console.log("  source directory = %s", dirs.source);
    console.log("  output directory = %s", dirs.output);

    const config = {
        mode: devMode,

        entry: { [appName]: path.resolve(dirs.source, app.entryPoint) },

        output: {
            path: dirs.output,
            filename: isDevMode ? "js/[name].dev.js" : "js/[name].min.js"
        },

        resolve: {
            modules: [
                dirs.modules
            ],
            // Aliases for FF Foundation Library components
            alias: {
                "client": path.resolve(dirs.source, "client"),
                "@ff/core": path.resolve(dirs.libs, "ff-core/source"),
                "@ff/graph": path.resolve(dirs.libs, "ff-graph/source"),
                "@ff/ui": path.resolve(dirs.libs, "ff-ui/source"),
                "@ff/react": path.resolve(dirs.libs, "ff-react/source"),
                "@ff/browser": path.resolve(dirs.libs, "ff-browser/source"),
                "@ff/three": path.resolve(dirs.libs, "ff-three/source"),
                "@ff/scene": path.resolve(dirs.libs, "ff-scene/source"),
                "three$": path.resolve(dirs.modules, "three/src/Three"),
                "../../../build/three.module.js": path.resolve(dirs.modules, "three/src/Three")
            },
            // Resolvable extensions
            extensions: [".ts", ".tsx", ".js", ".json"],
            // Fallbacks
            fallback: {
                "stream": require.resolve("stream-browserify"), // include a polyfill for stream
                "buffer": require.resolve("buffer"), // include a polyfill for buffer
                "path": false,
            },
        },

        optimization: {
            //concatenateModules: false,
            minimize: !isDevMode,

            minimizer: [
                new TerserPlugin({ parallel: true }),
                new CSSMinimizerPlugin(),
            ]
        },

        plugins: [
            new webpack.DefinePlugin({
                ENV_PRODUCTION: JSON.stringify(!isDevMode),
                ENV_DEVELOPMENT: JSON.stringify(isDevMode),
                ENV_OFFLINE: JSON.stringify(isOffline),
                ENV_VERSION: JSON.stringify(appTitle),
            }),
            new MiniCssExtractPlugin({
                filename: isDevMode ? "css/[name].dev.css" : "css/[name].min.css",
                //allChunks: true
            }),
            new HTMLWebpackPlugin({
                filename: isDevMode ? `${appName}-dev${localTag}.html` : `${appName}${localTag}.html`,
                template: app.template,
                title: appTitle,
                version: version,
                isDevelopment: isDevMode,
                isOffline: isOffline,
                analyticsId: analyticsId,
                element: `<${appName}></${appName}>`,
                chunks: [ appName ],
            })
        ],

        // loaders execute transforms on a per-file basis
        module: {
            rules: [
                {
                    // Raw text and shader files
                    test: /\.(txt|glsl|hlsl|frag|vert|fs|vs)$/,
                    loader: "raw-loader"
                },
                {
                    // Enforce source maps for all javascript files
                    enforce: "pre",
                    test: /\.js$/,
                    loader: "source-map-loader"
                },
                {
                    // Transpile SCSS to CSS and concatenate (to string)
                    test: /\.scss$/,
                    use: ["raw-loader","sass-loader"],
                    issuer: {
                        //include: /source\/client\/ui\/explorer/     // currently only inlining explorer css
                        and: [/source\/client\/ui\/explorer/]     // currently only inlining explorer css
                    }
                },
                {
                    // Transpile SCSS to CSS and concatenate
                    test: /\.scss$/,
                    use: /*appName === 'voyager-explorer' ? ["raw-loader","sass-loader"] :*/
                        [         
                            MiniCssExtractPlugin.loader,
                            "css-loader",
                            "sass-loader"
                        ],
                    issuer: {
                        not: [/source\/client\/ui\/explorer/]     // currently only inlining explorer css
                    }
                },
                {
                    test: /content\.css$/i,
                    use: ['css-loader'],
                },
                {
                    // Concatenate CSS
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        //"style-loader",
                        "css-loader",
                    ]
                },
                {
                    // Typescript/JSX files
                    test: /\.tsx?$/,
                    use: "ts-loader",
		            exclude: /node_modules/,
                },
                {
                    test: /\.hbs$/,
                    loader: "handlebars-loader"
                },
            ]
        },

        // When importing a module whose path matches one of the following, just
        // assume a corresponding global variable exists and use that instead.
        externals: {
            //"three": "THREE",
            "quill": "Quill",
            //"../../../build/three.module.js": "THREE",  // patch to handle three jsm modules until there is a better routing option
        },

        stats: {chunkModules: true, excludeModules: false }
    };

    if (isDevMode) {
        config.devtool = "source-map";
    }

    return config;
}
