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

const path = require("path");
const childProcess = require("child_process");
const webpack = require("webpack");

const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CSSMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
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

let version;
try{
    version = childProcess.execSync("git describe --tags").toString().trim();
}catch(e){
    //Fallback if git is not present or tags have not been fetched
    version = require(path.resolve(project, "./package.json")).version;
}

const analyticsId = process.env["VOYAGER_ANALYTICS_ID"];

////////////////////////////////////////////////////////////////////////////////

module.exports = function(env, argv)
{
    const appKey = env.app || "explorer";
    const isDevMode = argv.mode !== undefined ? argv.mode !== "production" : process.env["NODE_ENV"] !== "production";
    const isOffline = argv.offline !== undefined ? true : process.env["VOYAGER_OFFLINE"] === "true";


    const devMode = isDevMode ? "development" : "production";
    const localTag = isOffline ? "-offline" : "";

    const build_apps = (appKey === "all" ? Object.values(apps):[apps[appKey]]);
    if(!build_apps[0]){
        throw new Error(`can't build, app '${appKey}' not found.`);
    }
    const entries = build_apps.reduce((entries, app) =>({
        ...entries,
        [app.name]: path.resolve(dirs.source, app.entryPoint)
    }),{});

    const plugins =build_apps.map((app) =>{
        return new HTMLWebpackPlugin({
            filename: isDevMode ? `${app.name}-dev${localTag}.html` : `${app.name}${localTag}.html`,
            template: app.template,
            title: `${app.title} ${version} ${isDevMode ? " DEV" : " PROD"}`,
            version: version,
            isDevelopment: isDevMode,
            isOffline: isOffline,
            analyticsId: analyticsId,
            element: `<${app.name}></${app.name}>`,
            chunks: [ app.name ],
        })
    });

    const config = {
        mode: devMode,

        entry: entries,

        output: {
            path: dirs.output,
            filename: isDevMode ? "js/[name].dev.js" : "js/[name].min.js",
            //clean: true,
        },

        resolve: {
            // Aliases for FF Foundation Library components
            alias: {
                "client": path.resolve(dirs.source, "client"),
                "@ff/core": path.resolve(dirs.libs, "ff-core/source"),
                "@ff/graph": path.resolve(dirs.libs, "ff-graph/source"),
                "@ff/ui": path.resolve(dirs.libs, "ff-ui/source"),
                "@ff/browser": path.resolve(dirs.libs, "ff-browser/source"),
                "@ff/three": path.resolve(dirs.libs, "ff-three/source"),
                "@ff/scene": path.resolve(dirs.libs, "ff-scene/source"),
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
            ],
            splitChunks: {
                chunks: ()=>false, //Disable common chunks splitting
            }
        },

        plugins: [
            new webpack.DefinePlugin({
                ENV_PRODUCTION: JSON.stringify(!isDevMode),
                ENV_DEVELOPMENT: JSON.stringify(isDevMode),
                ENV_OFFLINE: JSON.stringify(isOffline),
                ENV_VERSION: JSON.stringify(`Voyager ${version} ${isDevMode ? " DEV" : " PROD"}`),
            }),
            new MiniCssExtractPlugin({
                filename: isDevMode ? "css/[name].dev.css" : "css/[name].min.css",
                //allChunks: true
            }),

            new CopyPlugin({
                patterns: [
                    {
                        from: "**/*",
                        context: dirs.assets,
                    },
                    {
                        from: "{LICENSE.md,3RD_PARTY_LICENSES.txt}",
                        context: dirs.project,
                    }
                ],
            }),
            ...plugins
        ],

        // loaders execute transforms on a per-file basis
        module: {
            rules: [
                {
                    // Raw text and shader files
                    test: /\.(txt|glsl|hlsl|frag|vert|fs|vs)$/,
                    type: "asset/source",
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
                    use: ["sass-loader"],
                    type: "asset/source",
                    issuer: {
                        //include: /source\/client\/ui\/explorer/     // currently only inlining explorer css
                        and: [/source\/client\/ui\/explorer/]     // currently only inlining explorer css
                    }
                },
                {
                    // Transpile SCSS to CSS and concatenate
                    test: /\.scss$/,
                    use: [         
                        MiniCssExtractPlugin.loader,
                        "css-loader",
                        "sass-loader"
                    ],
                    type: "javascript/auto",
                    issuer: {
                        not: [/source\/client\/ui\/explorer/]     // currently only inlining explorer css
                    }
                },
                {
                    resourceQuery: /raw/,
                    type: "asset/source",
                },
                {
                    // Concatenate CSS
                    test: /\.css$/,
                    resourceQuery: { not: [/raw/] },
                    use: [
                        MiniCssExtractPlugin.loader,
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
        performance: {hints: false},
        stats: {chunkModules: true, excludeModules: false }

    };

    if (isDevMode) {
        config.devtool = "source-map";
    }

    return config;
};
