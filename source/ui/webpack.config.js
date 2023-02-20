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

const path = require("path");
const webpack = require("webpack");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
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


const version = require(path.resolve(project, "package.json")).version;



////////////////////////////////////////////////////////////////////////////////

module.exports = function createAppConfig(env, argv)
{
    const isDevMode = (typeof argv?.mode !== "undefined") ? argv.mode !== "production" : process.env["NODE_ENV"] !== "production";
    const devMode = isDevMode ? "development" : "production";
    
    const hbsParams = {
        version: version,
        isDevelopment: isDevMode,
        isOffline: false,
    };

    const config = {
        mode: devMode,
        cache: {type: "filesystem"},
        entry: {
            "story": "client/ui/story/MainView.ts",
            "explorer": "client/ui/explorer/MainView.ts",
            "corpus": "source/ui/MainView.ts",
        },

        output: {
            path: dirs.output,
            filename: "js/[name].js",
            publicPath: '/',
        },

        resolve: {
            modules: [
                path.join(dirs.source, "ui/node_modules"),
                dirs.modules,
            ],
            // Aliases for FF Foundation Library components
            alias: {
                "source": dirs.source,
                "client": path.resolve(dirs.source, "client"),
                "@ff/core": path.resolve(dirs.libs, "ff-core/source"),
                "@ff/graph": path.resolve(dirs.libs, "ff-graph/source"),
                "@ff/ui": path.resolve(dirs.libs, "ff-ui/source"),
                "@ff/react": path.resolve(dirs.libs, "ff-react/source"),
                "@ff/browser": path.resolve(dirs.libs, "ff-browser/source"),
                "@ff/three": path.resolve(dirs.libs, "ff-three/source"),
                "@ff/scene": path.resolve(dirs.libs, "ff-scene/source"),
                "three$": path.resolve(dirs.modules, "three/src/Three"),
                "../../../build/three.module.js": path.resolve(dirs.modules, "three/src/Three"),
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
            emitOnErrors: !isDevMode, //Should be disabled when possible
        },

        plugins: [
            new webpack.DefinePlugin({
                ENV_PRODUCTION: JSON.stringify(!isDevMode),
                ENV_DEVELOPMENT: JSON.stringify(isDevMode),
                ENV_OFFLINE: JSON.stringify(false),
                ENV_VERSION: JSON.stringify("e-corpus-"+version+(isDevMode?"-dev":"")),
            }),
            new MiniCssExtractPlugin({
                filename: "css/[name].css",
                //allChunks: true
            }),
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

        stats: {chunkModules: true, excludeModules: false }
    };

    if (isDevMode) {
        config.devtool = "source-map";
    }

    return config;
}
