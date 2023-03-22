import fs from "fs/promises";
import path from "path";
import {tmpdir} from "os";

import request from "supertest";
import { expect } from "chai";

import express, { Application } from "express";
import User from "../../auth/User";
import UserManager from "../../auth/UserManager";
import Vfs from "../../vfs";
import { Element, xml2js } from "xml-js";



describe("PROPFIND /scenes", function(){
  let vfs :Vfs, userManager :UserManager, user :User, admin :User, scene_id :number;
  this.beforeEach(async function(){
    let locals = await createIntegrationContext(this);
    vfs = locals.vfs;
    userManager = locals.userManager;
    user = await userManager.addUser("bob", "12345678");
    admin = await userManager.addUser("alice", "12345678", true);

    scene_id = await vfs.createScene("foo", user.uid);
    await vfs.writeDoc("{}", scene_id, user.uid);
    await vfs.writeFile(dataStream(), {scene: "foo", mime:"model/gltf-binary", name: "models/foo.glb", user_id: user.uid});
  });
  this.afterEach(async function(){
    await cleanIntegrationContext(this);
  });

  it("can discover /scenes non recursively", async function(){
    let r = await request(this.server).propfind("/scenes")
    .set("Depth", "1")
    .expect(207);
    let root = xml2js(r.text);
    let elements = root.elements[0]?.elements;

    let names = elements.map((res :any)=>new URL(res.elements[0].elements[0].text).pathname);
    expect(names).to.deep.equal([
      "/scenes/",
      "/scenes/foo/"
    ]);
  });
    
  it("will omit private scenes", async function(){
    await userManager.grant("foo", "default", "none");
    let r = await request(this.server).propfind("/scenes")
    .set("Depth", "1")
    .expect(207);
    let root = xml2js(r.text);
    let elements = root.elements[0]?.elements;
    let names = elements.map((res :any)=>new URL(res.elements[0].elements[0].text).pathname);
    expect(names).to.deep.equal([
      "/scenes/",
    ]);
  })

  describe("/scenes/:scene", function(){
    it("can discover a scene", async function(){
      await Promise.all([
        vfs.writeFile(dataStream(),{scene:"foo", mime:"text/html", name:"articles/hello.html", user_id: user.uid}),
        vfs.writeFile(dataStream(), {scene: "foo", mime:"image/jpeg", name: "foo-image-thumb.jpg", user_id:user.uid}),
      ]);
      let r = await request(this.server).propfind("/scenes/foo")
      expect(r.error, r.error as any).not.to.be.ok;
      let {elements} = xml2js(r.text);
      expect(elements).to.be.an("array");
      expect(elements).to.have.property("length",1);
      expect(elements[0]).to.have.property("name", "D:multistatus");
      elements = elements[0].elements;
      let found = [];
      for(let el of elements){
        if(el.name == "D:response"){
          expect(el.elements).to.have.property("length", 2)
          expect(el.elements[0]).to.have.property("name", "D:href");
          expect(el.elements[1]).to.have.property("name", "D:propstat");
          found.push(el.elements[0].elements[0].text);
        }else{
          expect.fail("Unexpected element : "+el.name);
        }
      }
      expect(found.sort().map(s=>new URL(s).pathname)).to.deep.equal([
        "/scenes/foo/",
        "/scenes/foo/foo-image-thumb.jpg",
        "/scenes/foo/models/",
        "/scenes/foo/models/foo.glb",
        "/scenes/foo/scene.svx.json",
        "/scenes/foo/articles/",
        "/scenes/foo/articles/hello.html",
      ].sort());
    });

    it("can list a scene's folder", async function(){
      let r = await request(this.server).propfind("/scenes/foo/articles")
      .set("Depth", "1")
      .expect(207);
      let root = xml2js(r.text);
      let elements = root.elements[0]?.elements;
      expect(elements).to.be.an("array").to.have.property("length", 1);
      const response = elements[0];
      expect(response).to.have.property("name", "D:response");
      expect(response.elements.map((e:Element)=>e.name)).to.deep.equal(["D:href", "D:propstat"]);
      let propstat = response.elements[1];
      expect(propstat.elements.map((e:Element)=>e.name)).to.deep.equal(["D:status", "D:prop"]);
      let props = propstat.elements[1];
      expect(props.elements).to.deep.include({
        type: "element",
        name: "D:resourcetype",
        elements: [{"type": "element", "name":  "D:collection"}],
      });
    });

    it("can discover a scene's file", async function(){
      await vfs.writeFile(dataStream(),{scene:"foo", mime:"text/html", name:"articles/hello.html", user_id: user.uid})
      let r = await request(this.server).propfind("/scenes/foo/articles/hello.html")
      .set("Depth", "1")
      .expect(207);
      let root = xml2js(r.text);
      let elements = root.elements[0]?.elements;
      expect(elements, "expected one response").to.be.an("array").to.have.property("length", 1);
      const response = elements[0];
      expect(response).to.have.property("name", "D:response");
      expect(response.elements.map((e:Element)=>e.name)).to.deep.equal(["D:href", "D:propstat"]);
      let propstat = response.elements[1];
      expect(propstat.elements.map((e:Element)=>e.name)).to.deep.equal(["D:status", "D:prop"]);
      let props = propstat.elements[1];
      expect(props.elements, JSON.stringify(props.elements, null, 2)).to.deep.include({
        type: "element",
        name: "D:getcontenttype",
        elements:[{type: "text", text: "text/html"}]
      });
    });

    it("lists empty folders", async function(){
      
    });
  })
});
