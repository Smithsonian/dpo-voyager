import fs from "fs/promises";
import path from "path";
import {tmpdir} from "os";
import timers from 'timers/promises';

import request from "supertest";
import { expect } from "chai";
import { once } from "events";
import postScene from "./post";
import express, { Application } from "express";
import wrap from "../../../../../utils/wrapAsync";
import Vfs from "../../../../../vfs";



describe("POST /api/v1/scenes/:scene", function(){
  let vfs:Vfs, app: Application, data:Buffer;
  this.beforeEach(async function(){
    data = await fs.readFile(path.join(__dirname, "../../../../../__test_fixtures/cube.glb"));
    this.dir = await fs.mkdtemp(path.join(tmpdir(), `scenes-integration`));
    vfs = await Vfs.Open(this.dir,{createDirs: true});
    app = express();
    app.locals.vfs = vfs;
    app.post("/scenes/:scene", wrap(postScene));
  });
  this.afterEach(async function(){
    await vfs.close();
    await fs.rm(this.dir, {recursive: true});
  });

  it("creates .glb and .svz.json files", async function(){
    await request(app).post("/scenes/foo")
    .send(data)
    .expect(201);
    await expect(vfs.getScenes()).to.eventually.have.property("length", 1);
  });

  it("has a soft lock over the scene file", async function(){
    //Tries to do two concurrent requests over the same file
    const r1 = request(app).post("/scenes/foo")
    .send(data);
    await timers.setImmediate();
    const r2 = request(app).post("/scenes/foo")
    .send(data);
    
    await Promise.all([
      r1.expect(201),
      r2.then(res=> expect(res.text).to.match(/A scene named foo already exists/))
    ]);
  });

  it("rejects bad files", async function(){
    await request(app).post("/scenes/foo")
    .send("foo")
    .expect(500);
    expect( await vfs.getScenes()).to.have.property("length", 0);
    expect(await vfs._db.get(`SELECT COUNT(*) AS count FROM files`)).to.have.property("count", 0);
    expect(await vfs._db.get(`SELECT COUNT(*) AS count FROM documents`)).to.have.property("count", 0);
  })
});