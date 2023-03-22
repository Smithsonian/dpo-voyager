import fs from "fs/promises";
import path from "path";
import {tmpdir} from "os";

import request from "supertest";
import createServer from "./server";
import Vfs, { DocProps, WriteFileParams } from "./vfs";
import User from "./auth/User";
import { Element, xml2js } from "xml-js";
import UserManager from "./auth/UserManager";



describe("Web Server Integration", function(){
  let vfs :Vfs, userManager :UserManager, user :User, admin :User;
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

  describe("html content", function(){
    this.beforeEach(async function(){
      await fs.mkdir(path.join(this.dir, "dist"), {recursive: true});
      await fs.writeFile(path.join(this.dir, "dist", "ecorpus-main.html"), "<html></html>");
    });

    ["/ui/scenes/", "/ui/users"].forEach(function(path){
      it(`GET ${path}`, async function(){
        await request(this.server).get(path)
        .expect("Content-Type", "text/html; charset=utf-8")
        .expect(200);
      })
    });
  });

  describe("permissions", function(){
    let scene_id :number;
    this.beforeEach(async function(){
      scene_id = await vfs.createScene("foo", user.uid);
      await vfs.writeDoc("{}", scene_id, user.uid);
      await vfs.writeFile(dataStream(), {scene: "foo", mime:"model/gltf-binary", name: "models/foo.glb", user_id: user.uid});
    });
    describe("(anonymous)", function(){
      
      it("can GET files in scenes/", async function(){
        await request(this.server).get("/scenes/foo/models/foo.glb").expect(200);
      });
      it("can't create a model", async function(){
        await request(this.server).put("/scenes/bar/models/bar.glb").expect(401);
      });
      it("can't fetch user list", async function(){
        await request(this.server).get("/api/v1/users")
        .expect(401);
      });
    });

    describe("(author)", function(){
      this.beforeEach(async function(){
        this.agent = request.agent(this.server);
        await this.agent.post("/api/v1/login")
        .send({username: user.username, password: "12345678"})
        .set("Content-Type", "application/json")
        .set("Accept", "")
        .expect(200);
      });

      it("can create a new scene", async function(){
        let content = await fs.readFile(path.join(__dirname, "__test_fixtures/cube.glb"));
        let r = await this.agent.post("/api/v1/scenes/bar")
        .set("Content-Type", "application/octet-stream")
        .send(content)
        let res = await this.agent.get("/scenes/bar/models/bar.glb").expect(200);
        expect(res.text.slice(0,4).toString()).to.equal("glTF");
        expect(res.text.length).to.equal(content.length);

        let {body:doc} = await this.agent.get("/scenes/bar/bar.svx.json").expect(200);
        expect(doc).to.have.property("models").an("array").to.have.length(1);
      });

      it("can upload a glb model in an existing scene", async function(){
        let content = await fs.readFile(path.join(__dirname, "__test_fixtures/cube.glb"));
        await this.agent.put("/scenes/foo/models/baz.glb")
        .send(content)
        .expect(201);
      });

      it("can upload a usdz model in an existing scene", async function(){
        await this.agent.put("/scenes/foo/models/baz.usdz")
        .send("xxx\n")
        .expect(201);
      });

      it("can edit a model", async function(){
        await this.agent.put("/scenes/foo/models/foo.glb").send("foo\n").expect(200);
        let {body} = await this.agent.get("/scenes/foo/models/foo.glb").expect(200);
        expect(body.toString()).to.equal("foo\n");
      });

      it("can PUT an article", async function(){
        await this.agent.put("/scenes/foo/articles/something-something.html")
        .set("Content-Type", "text/html")
        .send("foo")
        .expect(201);
      });

      it("can PUT a modified document", async function(){
        let c = `{"foo":"bar"}`
        await this.agent.put("/scenes/foo/foo.svx.json")
        .set("Content-Type", "application/si-dpo-3d.document+json")
        .send(c)
        .expect(204);
        let {text} = await this.agent.get("/scenes/foo/foo.svx.json")
        .expect("Content-Type", "application/si-dpo-3d.document+json")
        .expect(200);
        expect(()=>JSON.parse(text)).not.to.throw()
        expect(JSON.parse(text)).to.deep.equal(JSON.parse(c));
      });

      it("rejects invalid JSON documents", async function(){
        let c = `xxx`
        await this.agent.put("/scenes/foo/foo.svx.json")
        .set("Content-Type", "application/octet-stream")
        .send(c)
        .expect(400);
      });


      it("can grant permissions", async function(){
        let dave = await userManager.addUser("dave", "12345678");
        await this.agent.patch("/api/v1/scenes/foo/permissions")
        .send({username: "dave", access: "write"})
        .expect(204);

        let r = await this.agent.get("/api/v1/scenes/foo/permissions")
        .expect(200)
        .expect("Content-Type", "application/json; charset=utf-8");
        expect(r, JSON.stringify(r.body)).to.have.property("body").to.deep.equal([
          {uid:0, username: "default", access: "read"},
          {uid:1, username: "any", access: "read"},
          {uid:user.uid, username: user.username, access: "admin"},
          {uid:dave.uid, username: dave.username, access: "write"},
        ]);
      });

      it("can make a model private", async function(){
        await this.agent.patch("/api/v1/scenes/foo/permissions")
        .send({username: "default", access: "none"})
        .expect(204);

        let r = await this.agent.get("/api/v1/scenes/foo/permissions")
        .expect(200)
        .expect("Content-Type", "application/json; charset=utf-8");
        expect(r).to.have.property("body").to.deep.equal([
          {uid: 0, username: "default", access: "none"},
          {uid:1, username: "any", access: "read"},
          {uid:user.uid, username: user.username, access: "admin"}
        ]);
      });

      it("can remove a user's special permissions", async function(){
        await this.agent.patch("/api/v1/scenes/foo/permissions")
        .send({username: user.username, access: null})
        .expect(204);

        let r = await this.agent.get("/api/v1/scenes/foo/permissions")
        .expect(200)
        .expect("Content-Type", "application/json; charset=utf-8");
        expect(r).to.have.property("body").to.deep.equal([
          {uid: 0, username: "default", access: "read"},
          {uid:1, username: "any", access: "read"},
        ]);

      });
    });
  });
  describe("(user)", function(){
    let eve;
    this.beforeEach(async function(){
      eve = await userManager.addUser("eve", "12345678");

      this.agent = request.agent(this.server);
      await this.agent.post("/api/v1/login")
      .send({username: eve.username, password: "12345678"})
      .set("Content-Type", "application/json")
      .set("Accept", "")
      .expect(200);
    });
    it("can't edit other people's models", async function(){
      await this.agent.put("/scenes/foo/models/foo.glb").send("foo\n").expect(401);
    });
    it.skip("can be granted permissions", async function(){
      
    })
  })
})
