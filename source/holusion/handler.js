'use strict';
const fs = require("fs/promises");
const path = require('path');
const express = require('express');

const isProduction = process.env["NODE_ENV"] !== "development";

function wrap(handler){
  return (req, res, next)=> Promise.resolve(handler(req, res)).catch(next);
}



const handler = express();
// FIXME : cache-control when in production
handler.get("/", (req, res)=>res.sendFile(path.resolve(__dirname, "../../dist/voyager-split.html")));
handler.get("/scene", (req, res)=>res.sendFile(path.resolve(__dirname, "../../dist/voyager-split.html")));

handler.use("/client", express.static(path.resolve(__dirname, "client")));


handler.use(express.static(path.resolve(__dirname, "assets")));
handler.use(express.static(path.resolve(__dirname, "../../files")));
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

module.exports = async function handle(port=0){
  return new Promise(resolve=>{
    let server = handler.listen(port, ()=>resolve(server));
  });
};