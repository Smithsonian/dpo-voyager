import fs from "fs/promises";
import path from "path";
import {tmpdir} from "os";

import request from "supertest";
import { expect } from "chai";

import express, { Application } from "express";

import Vfs from "../../../../vfs";



describe("GET /api/v1/scenes", function(){
  let vfs:Vfs, app: Application, ids :number[];
  this.beforeEach(async function(){
    this.dir = await fs.mkdtemp(path.join(tmpdir(), `scenes-integration`));
    vfs = await Vfs.Open(this.dir,{createDirs: true});
    ids = await Promise.all([
        vfs.createScene("foo"),
        vfs.createScene("bar"),
    ]);

    app = express();
    app.locals.vfs = vfs;
    app.use("/", (await import("../index")).default);
  });
  this.afterEach(async function(){
    await vfs.close();
    await fs.rm(this.dir, {recursive: true});
  });

  it("returns a list of scene names as text", async function(){
    let r = await request(app).get("/scenes")
    .set("Accept", "text/plain")
    .expect(200);
    expect(r.text).to.equal(`bar\nfoo\n`);
  });
  it("defaults to JSON with full data", async function(){
    let r = await request(app).get("/scenes")
    .expect(200)
    .expect("Content-Type", "application/json; charset=utf-8");
    expect(r.body).to.have.property("length", 2);
  });
  
  it("can send a zip file", async function(){
    let r = await request(app).get("/scenes")
    .set("Accept", "application/zip")
    .expect(200)
    .expect("Content-Type", "application/zip");
  });

  describe("can get a list of scenes", function(){
    let scenes:number[];
    this.beforeEach(async ()=>{
      scenes = await Promise.all([
        vfs.createScene("s1"),
        vfs.createScene("s2"),
      ]);
    });

    it("by name", async function(){
      let r = await request(app).get("/scenes?name=s1&name=s2")
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", "application/json; charset=utf-8");
      expect(r.body).to.have.property("length", 2);
    });
    
    it("by ids", async function(){
      let r = await request(app).get(`/scenes?${scenes.map(id=>`id=${id}`).join("&")}`)
      .set("Accept", "application/json")
      .send({scenes: scenes})
      .expect(200)
      .expect("Content-Type", "application/json; charset=utf-8");
      expect(r.body).to.have.property("length", 2);
    });
  })

});
