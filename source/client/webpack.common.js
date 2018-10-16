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

const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

//////////////////////////////////////////////////////////////////////////////// 

const projectDir = path.resolve(__dirname, "../..");
const sourceDir = path.resolve(projectDir, "source");
const targetDir = path.resolve(projectDir, "services/server/static/app");
const moduleDir = path.resolve(projectDir, "node_modules");
const libDir = path.resolve(projectDir, "libs");

////////////////////////////////////////////////////////////////////////////////

module.exports = {

    entry: {
        "voyager-explorer": path.resolve(sourceDir, "client/explorer/main.tsx"),
        "voyager-prep": path.resolve(sourceDir, "client/prep/main.tsx"),
        "voyager-story": path.resolve(sourceDir, "client/story/main.tsx"),
        "voyager-inspector": path.resolve(sourceDir, "client/inspector/main.tsx")
    },

    output: {
        path: targetDir,
        filename: "js/[name].js"
    },

    resolve: {
        modules: [
            moduleDir
        ],
        // Aliases for FF Foundation Library components
        alias: {
            "common": path.resolve(sourceDir, "common"),
            "@ff/core": path.resolve(libDir, "ff-core/source"),
            "@ff/react": path.resolve(libDir, "ff-react/source"),
            "@ff/browser": path.resolve(libDir, "ff-browser/source"),
            "@ff/three": path.resolve(libDir, "ff-three/source")
        },
        // Resolvable extensions
        extensions: [".ts", ".tsx", ".js", ".json"]
    },

    plugins: [
        new MiniCssExtractPlugin({
            filename: "css/[name].css",
            allChunks: true
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
                    "css-loader",
                    "sass-loader"
                ]
            },
            {
                // Concatenate CSS
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'style-loader',
                    'css-loader'
                ]
            }
        ]
    },

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
        "three": "THREE",
        "socket.io": "io"
    }
};
