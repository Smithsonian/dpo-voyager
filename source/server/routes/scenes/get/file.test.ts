import fs from "fs/promises";
import path from "path";
import {tmpdir} from "os";

import request from "supertest";
import { expect } from "chai";

import express, { Application } from "express";
import User from "../../../auth/User";
import UserManager from "../../../auth/UserManager";
import Vfs from "../../../vfs";
import { Element, xml2js } from "xml-js";



describe("GET /scenes/:scene/:filename(.*)", function(){
  
  let vfs :Vfs, userManager :UserManager, user :User, admin :User, scene_id :number;

  this.beforeEach(async function(){
    let locals = await createIntegrationContext(this);
    vfs = locals.vfs;
    userManager = locals.userManager;
    user = await userManager.addUser("bob", "12345678");
    admin = await userManager.addUser("alice", "12345678", true);

  });
  this.afterEach(async function(){
    await cleanIntegrationContext(this);
  });

  it("can get a public scene's file", async function(){
    scene_id = await vfs.createScene("foo", {"0":"read"});
    await vfs.writeDoc("{}", scene_id, user.uid);
    await vfs.writeFile(dataStream(), {scene: "foo", mime:"model/gltf-binary", name: "models/foo.glb", user_id: user.uid});

    await request(this.server).get("/scenes/foo/models/foo.glb")
    .expect(200)
    .expect("Content-Type", "model/gltf-binary")
    .expect("foo\n");
  });

  it("can't get a private scene's file", async function(){
    scene_id = await vfs.createScene("foo", {"0":"none", [user.uid]: "admin"});
    await vfs.writeDoc("{}", scene_id, user.uid);
    await vfs.writeFile(dataStream(), {scene: "foo", mime:"model/gltf-binary", name: "models/foo.glb", user_id: user.uid});

    await request(this.server).get("/scenes/foo/models/foo.glb")
    .expect(401);
  });

  it("can get an owned scene's file", async function(){
    scene_id = await vfs.createScene("foo", {"0":"none", [user.uid]: "admin"});
    await vfs.writeDoc("{}", scene_id, user.uid);
    await vfs.writeFile(dataStream(), {scene: "foo", mime:"model/gltf-binary", name: "models/foo.glb", user_id: user.uid});
    let agent = request.agent(this.server);
    await agent.post("/api/v1/login")
    .send({username: user.username, password: "12345678"})
    .set("Content-Type", "application/json")
    .set("Accept", "")
    .expect(200)
    .expect('set-cookie', /session=/);

    await agent.get("/scenes/foo/models/foo.glb")
    .expect(200)
    .expect("Content-Type", "model/gltf-binary")
    .expect("foo\n");
  });

  it("is case-sensitive", async function(){
    scene_id = await vfs.createScene("foo", {"0":"read", [user.uid]: "admin"});
    await vfs.writeDoc("{}", scene_id, user.uid);
    await vfs.writeFile(dataStream(), {scene: "foo", mime:"model/gltf-binary", name: "models/foo.glb", user_id: user.uid});
    await vfs.writeFile(dataStream(["FOO\n"]), {scene: "foo", mime:"model/gltf-binary", name: "models/FOO.GLB", user_id: user.uid});


    await request(this.server).get("/scenes/foo/models/FOO.GLB")
    .expect(200)
    .expect("Content-Type", "model/gltf-binary")
    .expect("FOO\n");


    await request(this.server).get("/scenes/foo/models/foo.glb")
    .expect(200)
    .expect("Content-Type", "model/gltf-binary")
    .expect("foo\n");
  });

});
