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

"use strict";

const fs = require("fs-extra");
const path = require("path");

const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const HTMLWebpackPlugin = require("html-webpack-plugin");

////////////////////////////////////////////////////////////////////////////////

const project = path.resolve(__dirname, "../..");

const dirs = {
    project,
    source: path.resolve(project, "source"),
    assets: path.resolve(project, "assets"),
    output: path.resolve(project, "dist"),
    modules: path.resolve(project, "node_modules"),
    libs: path.resolve(project, "libs")
};

////////////////////////////////////////////////////////////////////////////////

const version = "0.1.1";

const apps = {
    "explorer": {
        name: "voyager-explorer",
        entryPoint: "client/explorer/ui/MainView.ts",
        title: "Voyager Explorer " + version
    },
    "mini": {
        name: "voyager-mini",
        entryPoint: "client/mini/ui/MainView.ts",
        title: "Voyager Mini " + version
    },
    "story": {
        name: "voyager-story",
        entryPoint: "client/story/ui/MainView.ts",
        title: "Voyager Story " + version
    }
};

////////////////////////////////////////////////////////////////////////////////

module.exports = function(env, argv) {

    const isDevMode = argv.mode !== "production";
    const app = argv.app || "explorer";

    // copy static assets
    fs.copy(dirs.assets, dirs.output, { overwrite: true });

    if (app === "all") {
        return [
            createAppConfig("explorer", dirs, isDevMode),
            createAppConfig("mini", dirs, isDevMode),
            createAppConfig("story", dirs, isDevMode),
        ];
    }
    else {
        return createAppConfig(app, dirs, isDevMode);
    }
};

function createAppConfig(app, dirs, isDevMode)
{
    const devMode = isDevMode ? "development" : "production";

    const appName = apps[app].name;
    const appEntryPoint = apps[app].entryPoint;
    const appTitle = apps[app].title;

    console.log("VOYAGER - WEBPACK BUILD SCRIPT");
    console.log("application = %s", appName);
    console.log("mode = %s", devMode);
    console.log("output directory = %s", dirs.output);

    const config = {
        mode: devMode,

        entry: { [appName]: path.resolve(dirs.source, appEntryPoint) },

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
                "common": path.resolve(dirs.source, "common"),
                "@ff/core": path.resolve(dirs.libs, "ff-core/source"),
                "@ff/graph": path.resolve(dirs.libs, "ff-graph/source"),
                "@ff/ui": path.resolve(dirs.libs, "ff-ui/source"),
                "@ff/react": path.resolve(dirs.libs, "ff-react/source"),
                "@ff/browser": path.resolve(dirs.libs, "ff-browser/source"),
                "@ff/three": path.resolve(dirs.libs, "ff-three/source"),
                "@ff/scene": path.resolve(dirs.libs, "ff-scene/source")
            },
            // Resolvable extensions
            extensions: [".ts", ".tsx", ".js", ".json"]
        },

        optimization: {
            minimize: !isDevMode,

            minimizer: [
                new TerserPlugin({ parallel: true }),
                new OptimizeCSSAssetsPlugin({})
            ]
        },

        plugins: [
            new MiniCssExtractPlugin({
                filename: isDevMode ? "css/[name].dev.css" : "css/[name].min.css",
                allChunks: true
            }),
            new HTMLWebpackPlugin({
                filename: isDevMode ? `${appName}-dev.html` : `${appName}.html`,
                template: "index.hbs",
                title: appTitle,
                isDevelopment: isDevMode,
                element: `<${appName}></${appName}>`,
                chunks: [ appName ]
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
                    // Typescript/JSX files
                    test: /\.tsx?$/,
                    loader: "awesome-typescript-loader"
                },
                {
                    // Enforce source maps for all javascript files
                    enforce: "pre",
                    test: /\.js$/,
                    loader: "source-map-loader"
                },
                {
                    // Transpile SCSS to CSS and concatenate
                    test: /\.scss$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        { loader: "css-loader", options: { minimize: !isDevMode } },
                        "sass-loader"
                    ]
                },
                {
                    // Concatenate CSS
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'style-loader',
                        { loader: "css-loader", options: { minimize: !isDevMode } },
                    ]
                },
                {
                    test: /\.hbs$/,
                    loader: "handlebars-loader"
                }
            ]
        },

        // When importing a module whose path matches one of the following, just
        // assume a corresponding global variable exists and use that instead.
        externals: {
            "three": "THREE"
        }
    };

    if (isDevMode) {
        config.devtool = "source-map";
    }

    return config;
}
