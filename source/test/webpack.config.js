"use strict";

const path = require("path");
const { readdirSync } = require('fs');

const project = path.resolve(__dirname, "../..");

const dirs = {
    project,
    source: path.resolve(project, "source"),
    assets: path.resolve(project, "assets"),
    output: path.resolve(__dirname, "build"),
    modules: path.resolve(project, "node_modules"),
    libs: path.resolve(project, "libs"),
};


const list = (dir)=>{
  return readdirSync(dir, {withFileTypes:true}).map(f=>{
    if(f.isDirectory()) return list(path.join(dir,f.name));
    else return path.join(dir,f.name);
  }).flat().filter(f=>/\.test\.ts$/i.test(f))
}

const files = list(__dirname).map(p=>path.relative(__dirname, p)).reduce((entries, entry)=>({...entries, [entry.split("/").pop().replace(".test.ts", "")]: "./"+entry}), {});

module.exports = {
    mode: "development",
    devtool: "source-map",
    entry: files,
    context: __dirname,
    output: {
        path: dirs.output,
        filename: "test/[name].test.js",
        clean: true,
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
            "@ff/browser": path.resolve(dirs.libs, "ff-browser/source"),
            "@ff/three": path.resolve(dirs.libs, "ff-three/source"),
            "@ff/scene": path.resolve(dirs.libs, "ff-scene/source"),
        },
        // Resolvable extensions
        extensions: [".ts", ".tsx", ".js", ".json"],
        // Fallbacks
        fallback: { },
    },

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
                test: /\.s?css$/,
                use: ["null-loader"],
                issuer: {
                    //include: /source\/client\/ui\/explorer/     // currently only inlining explorer css
                    and: [/source\/client\/ui\/explorer/]     // currently only inlining explorer css
                }
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
};

