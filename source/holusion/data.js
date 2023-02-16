'use strict';
const https = require("https");
const {once} = require("events");
const { constants } = require("fs");
const fs = require("fs/promises");
const StreamZip = require("node-stream-zip");
const path = require("path");




module.exports = class DataCache{
  #control;
  #dir;
  #zip;

  state = "loading";

  get tmpfile(){
    return path.join(this.#dir, "~scenes.zip");
  }
  get file(){
    return path.join(this.#dir, "scenes.zip");
  }
  constructor(dir){
    this.#dir = dir;
  }

  static async Open(dir=path.join(process.env["HOME"], ".cache", "eCorpus")){
    await fs.mkdir(dir, {recursive: true});
    let dc = new DataCache(dir);
    return dc;
  }

  async close(){
    await this.#zip?.close();
  }

  async openFile(){
    return await (this.#zip ??= (async ()=>{
      await this.fetchZip();
      return new StreamZip.async({file: this.file});
    })());
  }

  async fetchZip(){
    if(this.#control) this.#control.abort();
    let c = this.#control = new AbortController();

    let {mtime:last} = await fs.stat(this.file).catch(e=>{
      if(e.code == "ENOENT") return {mtime:new Date(0)}
    });
    console.log("Fetch scenes zip if updated since",last.toUTCString());
    let req = https.request({
      method: "GET",
      hostname: "ecorpus.holusion.net",
      path: "/api/v1/scenes",
      headers: {
        "Accept": "application/zip",
        "If-Modified-Since": last.toUTCString(),
      },
      signal: c.signal,
      timeout: 2000
    });
    req.end();
    let [res] = await once(req, "response", {signal: c.signal });
    if(res.statusCode == 304) {
      console.log("Scenes are up to date");
      return res.destroy();
    }else if( res.statusCode != 200) throw new Error(`GET /api/v1/scenes [${res.statusCode}]: ${res.statusText}`);
    console.log("New update :", new Date(res.headers["last-modified"]).toUTCString())
    let handle = await fs.open(this.tmpfile, "w");
    try{
      for await (const data of res){
        await handle.write(data);
        if(c.signal.aborted) throw new Error("Aborted");
      }
    }finally{
      await handle.close();
    }
    if(c.signal.aborted) throw new Error("Aborted");
    await fs.rename(this.tmpfile, this.file );
    console.log("scenes data zip saved to:", this.file)
  }

  /**
   * 
   * @param {string} filepath 
   * @return {Promise<NodeJS.ReadableStream>}
   */
  async get(filepath){
    let zip = await this.openFile();
    return await zip.stream(filepath);
  }

  async entries(){
    let zip = await this.openFile();
    let entries = await zip.entries();
    return entries;
  }
}