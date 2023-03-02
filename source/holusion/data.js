'use strict';
const crypto = require("crypto");
const https = require("https");
const {once} = require("events");
const fs = require("fs/promises");
const StreamZip = require("node-stream-zip");
const path = require("path");
const { createReadStream } = require("fs");
const { addAbortSignal } = require("stream");
const {forward} = require("./forward");

/** 
 * @typedef {object} InternalState
 * @property {string[]} [cookies]
 * @property {string|undefined} [etag]
*/


module.exports = class DataCache{
  #control;
  #dir;
  /** @type {StreamZip.StreamZipAsync} */
  #zip;

  /**
   * @returns {Promise<InternalState>}
   */
  async getState(){
    try{
      return  JSON.parse(await fs.readFile(path.join(this.#dir, "state.json"), {encoding: "utf-8"}));
    }catch(e){
      if(e.code !== "ENOENT") throw e;
      return {};
    }
  }

  /**
   * Be careful with this, it's not safe to use in parallel with itself or getState()
   * @param {Partial<InternalState>} value 
   */
  async setState(value){
    let tmpfile = this.mktemp("state.json")
    await fs.writeFile(tmpfile,JSON.stringify({...this.getState(), ...value}, null, 2)+"\n");
    await fs.rename(tmpfile, path.join(this.#dir, "state.json"));
  }

  /** generate a unique file name in the cache directory */
  mktemp(name="scenes.zip"){
    return path.join(this.#dir, `~${crypto.randomBytes(3).toString("hex")}-${name}`);
  }

  get file(){
    return path.join(this.#dir, "scenes.zip");
  }

  constructor(dir){
    this.#dir = dir;
  }

  static async Open(dir){
    await fs.mkdir(dir, {recursive: true});
    let dc = new DataCache(dir);
    await dc.getState();
    return dc;
  }

  async close(){
    try{
      await this.#zip?.close();
    }catch(e){
      if(e.code !== "ENOENT") throw e;
    }
    this.#zip = null;
  }

  async openFile(force = false){
    if(!force && this.#zip) return this.#zip;
    await this.close();
    let zip = this.#zip = new StreamZip.async({file: this.file});
    await zip.entriesCount; //Ensure zip opened and parsed properly
    return zip;
  }

  abort(){
    if(this.#control) this.#control.abort();
    return this.#control = new AbortController();
  }

  async fetchZip(){
    let c = this.abort();
    let tmpfile = this.mktemp();
    let {etag, cookies } = await this.getState();
    console.log("Fetch scenes zip");
    let res = await forward({
      method: "GET",
      path: "/api/v1/scenes",
      headers: {
        "Accept": "application/zip",
        "ETag": etag,
        "Cookie": cookies,
      },
      signal: c.signal,
    });
    if(res.statusCode == 304) {
      console.log("Current zip is up to date");
      return res.destroy();
    }else if( res.statusCode != 200) throw new Error(`GET /api/v1/scenes [${res.statusCode}]: ${res.statusMessage}`);

    console.log("New update :", new Date(res.headers["last-modified"]).toUTCString());
    let handle = await fs.open(tmpfile, "w");
    try{
      for await (const data of addAbortSignal(c.signal,res)){
        await handle.write(data);
      }
    }finally{
      await handle.close().catch(e=>console.warn("Failed to close tmp file handle :", e));
    }
    if(c.signal.aborted) throw new Error("Aborted");
    await fs.rename(tmpfile, this.file );
    await this.openFile(true);
    await this.setState({etag: res.headers['etag']});
    console.log("scenes data zip saved to:", this.file)
  }

  /**
   * two-stage copy a file that probably isn't on the same disk
   * @param {string} sourceFile path to a file to copy
   * @return {Promise<void>}
   */
  async copy(sourceFile){
    let c = this.abort();
    let tmpfile = this.mktemp();
    let src = addAbortSignal(c.signal, createReadStream(sourceFile));
    let handle = await fs.open(tmpfile, "w");
    try{
      for await (let data of src){
        await handle.write(data);
      }
    }finally{
      await handle.close().catch(e=>console.warn("Failed to close tmp file handle :", e));
    }
    await fs.rename(tmpfile, this.file );
    console.log("Renamed new file");
    await this.openFile(true);
    console.log("scenes data zip saved to:", this.file);
    await this.setState({etag: undefined});
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