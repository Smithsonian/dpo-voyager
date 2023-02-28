'use strict';
const fs = require("fs/promises");
const path = require('path');
const express = require('express');
const DataCache = require("./data");

const isProduction = process.env["NODE_ENV"] !== "development";

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
  let entries = await dataCache.entries();
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