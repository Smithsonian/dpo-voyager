import fs from "fs/promises";
import path from "path";
import {tmpdir} from "os";
import timers from 'timers/promises';

import request from "supertest";
import { expect } from "chai";
import { once } from "events";
import getScenes from "./get";
import express, { Application, Request, Response } from "express";
import { EventEmitter, PassThrough } from "stream";
import { ClientRequest, ServerResponse } from "http";
import wrap from "../../../../utils/wrapAsync";
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
    app.get("/scenes", wrap(getScenes));
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
});
