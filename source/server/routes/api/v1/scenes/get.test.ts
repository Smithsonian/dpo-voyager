import fs from "fs/promises";
import path from "path";
import {tmpdir} from "os";

import request from "supertest";
import { expect } from "chai";

import Vfs from "../../../../vfs";
import UserManager from "../../../../auth/UserManager";
import User from "../../../../auth/User";



describe("GET /api/v1/scenes", function(){
  let vfs:Vfs, userManager:UserManager, ids :number[];
  this.beforeEach(async function(){
    let locals = await createIntegrationContext(this);
    vfs = locals.vfs;
    userManager  = locals.userManager;
    ids = await Promise.all([
        vfs.createScene("foo"),
        vfs.createScene("bar"),
    ]);
  });
  this.afterEach(async function(){
    await vfs.close();
    await fs.rm(this.dir, {recursive: true});
  });

  it("returns a list of scene names as text", async function(){
    let r = await request(this.server).get("/api/v1/scenes")
    .set("Accept", "text/plain")
    .expect(200);
    expect(r.text).to.equal(`bar\nfoo\n`);
  });

  it("defaults to JSON with full data", async function(){
    let r = await request(this.server).get("/api/v1/scenes")
    .expect(200)
    .expect("Content-Type", "application/json; charset=utf-8");
    expect(r.body).to.have.property("length", 2);
  });
  
  it("can send a zip file", async function(){
    let r = await request(this.server).get("/api/v1/scenes")
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
      let r = await request(this.server).get("/api/v1/scenes?name=s1&name=s2")
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", "application/json; charset=utf-8");
      expect(r.body).to.have.property("length", 2);
    });
    
    it("by ids", async function(){
      let r = await request(this.server).get(`/api/v1/scenes?${scenes.map(id=>`id=${id}`).join("&")}`)
      .set("Accept", "application/json")
      .send({scenes: scenes})
      .expect(200)
      .expect("Content-Type", "application/json; charset=utf-8");
      expect(r.body).to.have.property("length", 2);
    });
  });

  describe("can search scenes", async function(){
    let scenes:number[], user :User, admin :User;
    this.beforeEach(async ()=>{
      user = await userManager.addUser("bob", "12345678", false);
      admin = await userManager.addUser("alice", "12345678", true);
      scenes = await Promise.all([
        vfs.createScene("read", {[`${user.uid}`]:"read"}),
        vfs.createScene("write", {[`${user.uid}`]:"write"}),
      ]);
    });

    it("search by access level", async function(){
      let scene :any = await vfs.getScene("write", user.uid);

      delete scene.thumb;

      let r = await request(this.server).get(`/api/v1/scenes?access=write`)
      .auth(user.username, "12345678")
      .set("Accept", "application/json")
      .send({scenes: scenes})
      .expect(200)
      .expect("Content-Type", "application/json; charset=utf-8");
      expect(r.body).to.deep.equal([
        {
          ...scene,
          mtime: scene.mtime.toISOString(),
          ctime: scene.ctime.toISOString()
        },
      ]);
    });

    it("search by multiple access levels", async function(){
      await vfs.createScene("admin", {[`${user.uid}`]:"admin"});
      let s1 :any = await vfs.getScene("write", user.uid);
      let s2 :any = await vfs.getScene("admin", user.uid);

      delete s1.thumb;
      delete s2.thumb;

      let r = await request(this.server).get(`/api/v1/scenes?access=write&access=admin`)
      .auth(user.username, "12345678")
      .set("Accept", "application/json")
      .send({scenes: scenes})
      .expect(200)
      .expect("Content-Type", "application/json; charset=utf-8");
      expect(r.body).to.deep.equal([
        {
          ...s2,
          mtime: s2.mtime.toISOString(),
          ctime: s2.ctime.toISOString()
        },{
          ...s1,
          mtime: s1.mtime.toISOString(),
          ctime: s1.ctime.toISOString()
        },
      ]);

    })

    it("search by name match", async function(){
      let scenes = (await Promise.all([
        vfs.getScene("read", user.uid),
        vfs.getScene("write", user.uid),
      ])).map(({thumb, mtime, ctime, ...s})=>({
        ...s,
        mtime: mtime.toISOString(),
        ctime: ctime.toISOString()
      }));
      let r = await request(this.server).get(`/api/v1/scenes?match=e`)
      .auth(user.username, "12345678")
      .set("Accept", "application/json")
      .send({scenes: scenes})
      .expect(200)
      .expect("Content-Type", "application/json; charset=utf-8");
      expect(r.body).to.deep.equal(scenes);
    });
  });

});
