'use strict';
const https = require("https");
const fs = require("fs/promises");
const path = require('path');
const express = require('express');
const DataCache = require("./data");
const {forward, drain} = require("./forward");

const isProduction = process.env["NODE_ENV"] !== "development";

/**
 * @typedef {(req : import("express").Request, res :import("express").Response)=>Promise<any>} AsyncRequestHandler
 */

/**
 * 
 * @param {AsyncRequestHandler} handler 
 * @returns 
 */
function wrap(handler){
  return (req, res, next)=> Promise.resolve(handler(req, res)).catch(next);
}


const handler = express();
// FIXME : cache-control when in production
handler.get("/", (req, res)=>res.sendFile(path.resolve(__dirname, "../../dist/voyager-split.html")));
handler.get("/scene", (req, res)=>res.sendFile(path.resolve(__dirname, "../../dist/voyager-split.html")));

handler.use("/client", express.static(path.resolve(__dirname, "client")));

handler.get("/scenes/*", wrap(async (req, res)=>{
  let dataCache = req.app.locals.dataCache;
  console.log(`[${req.method}] ${req.path}`);
  let file = decodeURIComponent(req.path.slice(1));
  try{
    let stream = await dataCache.get(file);
    res.set("Content-Length", stream.length);
    res.status(200);
    stream.pipe(res);
  }catch(e){
    if(/Entry not found/.test(e.message)){
      console.log("Zip entry %s not found ", file);
      return res.status(404).send("Not Found");
    }else{
      console.log("Zip error for %s: ", file, e);
      res.status(500).send(e.message);
    }
  }
}));

handler.get("/documents.json", wrap(async (req, res)=>{
  let dataCache = req.app.locals.dataCache;
  let entries;
  try{
    entries = await dataCache.entries();
  }catch(e){
    if(e.code == "ENOENT") return res.status(404).send("No usable data zip file");
  }
  let scenes = {};
  for(let filepath of Object.keys(entries)){
    let m = /^scenes(?:\/([^\/]+))/.exec(filepath);
    if(!m) continue;
    let scene = scenes[m[1]] ??= {
      root: `scenes/${m[1]}/`,
      title: m[1],
      thumbnail: "/images/defaultSprite.svg",
    };
    if(filepath.endsWith("-image-thumb.jpg")){
      scene["thumbnail"] = filepath;
    }else if(filepath.endsWith(".svx.json")){
      //Parse scene file
    }
  }
  res.status(200).send({documents: Object.values(scenes)});
}))


handler.get("/files/list", wrap(async (req, res)=>{
  let dir = process.env["MEDIA_FOLDER"] || "/media/usb";
  let files = [];
  try{
    files = await fs.readdir(dir);
  }catch(e){
    if(e.code !=="ENOENT") throw e;
    console.warn("Can't find directory "+dir);
  }
  let zipFiles = files.filter(f=> f.toLowerCase().endsWith(".zip"));
  res.set("Content-Type", "application/json");
  res.status(200).send(zipFiles);
}));

handler.post("/files/copy/:filename", wrap(async (req, res)=>{
  let dataCache = req.app.locals.dataCache;
  let dir = process.env["MEDIA_FOLDER"] || "/media/usb";
  let file = path.join(dir, req.params.filename);
  await dataCache.copy(file);
  res.status(204).send();
}));

handler.post("/files/fetch", wrap(async (req, res)=>{
  
}))


handler.get("/login", wrap(async (req, res)=>{
  let dataCache = req.app.locals.dataCache;

  let r = await drain({
    path: "/api/v1/login",
    method: "GET",
    headers:{
      "Content-Type":"application/json",
      "Accept": "application/json",
      "Cookie": (await dataCache.getState()).cookies,
    },
  });
  let cookies = r.headers["set-cookie"].map(c=>c.split(";")[0]);
  if(cookies?.length){
    console.log("Save new login cookies");
    await dataCache.setState({cookies});
  }
  res.set("Content-Type", r.headers["content-type"]);
  res.status(r.statusCode).send(r.text);
}))

handler.post("/login", wrap(async (req, res)=>{
  let dataCache = req.app.locals.dataCache;
  let {username, password} = req.query;

  let data = JSON.stringify({
    username,
    password,
  });
  
  let r = await drain({
    path: "/api/v1/login",
    method: "POST",
    headers:{
      "Content-Type":"application/json",
      "Accept": "application/json",
      "Content-Length": Buffer.byteLength(data),
    },
     body: data
  });

  if(r.statusCode === 200){
    console.log("Save new login cookies");
    let cookies = r.headers["set-cookie"].map(c=>c.split(";")[0]);
    await dataCache.setState({cookies});
  }
  
  res.set("Content-Type", r.headers["content-type"]);
  return res.status(r.statusCode).send(r.text);
}));

handler.use(express.static(path.resolve(__dirname, "assets")));
handler.use(express.static(path.resolve(__dirname, "../../assets")));
handler.use(express.static(path.resolve(__dirname, "../../dist")));

handler.use("/libs/three", express.static(path.join(__dirname, "node_modules/three/build")));

// error handling
handler.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) {
      return next(error);
  }
  res.format({
    "text/plain":()=>{
      res.status(500).send(error.message);
    },
    "application/json": ()=>{
      res.status(500).send({
        code: 500,
        message: error.message,
      });
    }
  })
});

handler.use(function(req, res) {
  let msg = `Cannot ${req.method} ${req.path}`;
  console.log(msg);
  res.format({
    "text/plain":()=>{
      res.status(404).send(msg);
    },
    "application/json": ()=>{
      res.status(404).send({
        code: 404,
        message: msg,
      });
    }
  })
});

module.exports = async function handle({port=0, zip}){
  let dataCache = await DataCache.Open(zip);
  handler.locals.dataCache = dataCache;
  return await new Promise(resolve=>{
    let server = handler.listen(port, ()=>resolve(server));
  });
};