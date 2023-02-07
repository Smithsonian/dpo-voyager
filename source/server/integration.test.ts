import fs from "fs/promises";
import path from "path";
import {tmpdir} from "os";

import request from "supertest";
import createServer from "./server";
import { expect } from "chai";
import Vfs, { DocProps, WriteFileParams } from "./vfs";
import User from "./auth/User";
import { Element, xml2js } from "xml-js";
import UserManager from "./auth/UserManager";

async function *dataStream(src :Array<Buffer|string> =["foo", "\n"]){
  for(let d of src){
    let b = Buffer.isBuffer(d)?d: Buffer.from(d);
    yield await Promise.resolve(b);
  }
}


describe("Web Server Integration", function(){
  let vfs :Vfs, userManager :UserManager, user :User, admin :User;
  this.beforeEach(async function(){
    this.dir = await fs.mkdtemp(path.join(tmpdir(), `eThesaurus_integration_test`));
    this.server = await createServer(this.dir, {verbose: false, migrate: false, clean:false});
    vfs = this.server.locals.vfs;
    userManager = this.server.locals.userManager;
    user = await userManager.addUser("bob", "12345678");
    admin = await userManager.addUser("alice", "12345678", true);
  });
  this.afterEach(async function(){
    await fs.rm(this.dir, {recursive: true});
  });

  describe("html content", function(){
    this.beforeEach(async function(){
      await fs.mkdir(path.join(this.dir, "dist"), {recursive: true});
      await fs.writeFile(path.join(this.dir, "dist", "ecorpus-main.html"), "<html></html>");
    });

    ["/ui/", "/ui/users"].forEach(function(path){
      it(`GET ${path}`, async function(){
        await request(this.server).get(path)
        .expect("Content-Type", "text/html; charset=UTF-8")
        .expect(200);
      })
    });
  });

  describe("/api/v1/login", function(){
    it("sets a cookie", async function(){
      this.agent = request.agent(this.server);
      await this.agent.post("/api/v1/login")
      .send({username: user.username, password: "12345678"})
      .set("Content-Type", "application/json")
      .set("Accept", "")
      .expect(200)
      .expect('set-cookie', /session=/);
    });
    it("can get login status (not connected)", async function(){
      await request(this.server).get("/api/v1/login")
      .set("Accept", "application/json")
      .expect(200)
      .expect({isAdministrator:false, isDefaultUser: true});
    });
    
    it("can get login status (connected)", async function(){
      this.agent = request.agent(this.server);
      await this.agent.post("/api/v1/login")
      .send({username: user.username, password: "12345678"})
      .set("Content-Type", "application/json")
      .set("Accept", "")
      .expect(200);
      await this.agent.get("/api/v1/login")
      .set("Accept", "application/json")
      .expect(200)
      .expect({
        username: user.username, 
        uid: user.uid,
        isAdministrator:false,
        isDefaultUser:false
      });
    });

    it("can get login status (admin)", async function(){
      this.agent = request.agent(this.server);
      await this.agent.post("/api/v1/login")
      .send({username: admin.username, password: "12345678"})
      .set("Content-Type", "application/json")
      .set("Accept", "")
      .expect(200);
      await this.agent.get("/api/v1/login")
      .set("Accept", "application/json")
      .expect(200)
      .expect({
        username: admin.username, 
        uid: admin.uid,
        isAdministrator:true,
        isDefaultUser:false
      });
    });

    it("send a proper error if username is missing", async function(){
      this.agent = request.agent(this.server);
      let res = await this.agent.post("/api/v1/login")
      .send({/*no username */ password: "12345678"})
      .set("Content-Type", "application/json")
      .set("Accept", "")
      .expect(400);
      expect(res.body).to.have.property("message").match(/username not provided/);
    });
    it("send a proper error if password is missing", async function(){
      this.agent = request.agent(this.server);
      let res = await this.agent.post("/api/v1/login")
      .send({username: user.username /*no password */})
      .set("Content-Type", "application/json")
      .set("Accept", "")
      .expect(400);
      expect(res.body).to.have.property("message").match(/password not provided/);
    });
    it("can logout", async function(){
      let agent = request.agent(this.server);
      await agent.post("/api/v1/login")
      .send({username: user.username, password: "12345678"})
      .set("Content-Type", "application/json")
      .set("Accept", "")
      .expect(200)
      .expect('set-cookie', /session=/);

      await agent.post("/api/v1/logout")
      .expect(200);

      await agent.get("/api/v1/login")
      .expect(200)
      .expect({
        isDefaultUser: true,
        isAdministrator: false,
      });
    });
  });


  describe("permissions", function(){
    let scene_id :number;
    this.beforeEach(async function(){
      scene_id = await vfs.createScene("foo", user.uid);
      await vfs.writeDoc("{}", scene_id, user.uid);
      await vfs.writeFile(dataStream(), {scene: "foo", type:"models", name: "foo.glb", user_id: user.uid});
    });
    describe("(anonymous)", function(){
      it("can PROPFIND /scenes non recursively", async function(){
        let r = await request(this.server).propfind("/scenes")
        .set("Depth", "1")
        .expect(207);
        let root = xml2js(r.text);
        let elements = root.elements[0]?.elements;

        let names = elements.map((res :any)=>new URL(res.elements[0].elements[0].text).pathname);
        expect(names).to.deep.equal([
          "/scenes/",
          "/scenes/foo/"
        ])
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
      it("can PROPFIND /scenes/:scene/", async function(){
        await Promise.all([
          vfs.writeFile(dataStream(),{scene:"foo", type:"articles", name:"hello.html", user_id: user.uid}),
          vfs.writeFile(dataStream(), {scene: "foo", type: "images", name: "foo-image-thumb.jpg",user_id:user.uid}),
        ]);
        let r = await request(this.server).propfind("/scenes/foo").expect(207);
        let {elements} = xml2js(r.text);
        expect(elements).to.be.an("array");
        expect(elements).to.have.property("length",1);
        expect(elements[0]).to.have.property("name", "D:multistatus");
        elements = elements[0].elements;
        let expected = [
          "foo/articles", 
          "foo/articles/hello.html"
        ];
        let found = [];
        let unexpected = [];
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
          "/scenes/foo/models/foo.glb",
          "/scenes/foo/foo.svx.json",
          "/scenes/foo/articles/",
          "/scenes/foo/articles/hello.html",
          "/scenes/foo/videos/",
        ].sort());
      });
      it("can PROPFIND /scenes/:scene/articles", async function(){
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
      it("can PROPFIND /scenes/:scene/articles/hello.html", async function(){
        await vfs.writeFile(dataStream(),{scene:"foo", type:"articles", name:"hello.html", user_id: user.uid})
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
        expect(props.elements).to.deep.include({
          type: "element",
          name: "D:getcontenttype",
          elements:[{type: "text", text: "text/html"}]
        });
      });
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
        let {body} = await this.agent.get("/scenes/bar/models/bar.glb").expect(200);
        expect(body.slice(0,4).toString()).to.equal("glTF");
        expect(body.length).to.equal(content.length);

        let {body:doc} = await this.agent.get("/scenes/bar/bar.svx.json").expect(200);
        expect(doc).to.have.property("models").an("array").to.have.length(1);
      });

      it("can upload a glb model in an existing scene", async function(){
        let content = await fs.readFile(path.join(__dirname, "__test_fixtures/cube.glb"));
        await this.agent.put("/scenes/foo/models/baz.glb")
        .send(content)
        .expect(201);
        let {body:doc} = await this.agent.get("/scenes/foo/document.svx.json").expect(200);
        expect(doc).to.have.property("models").an("array").to.have.length(1);
        expect(doc).to.have.property("models").deep.equal([
          {
            "units": "mm",
            "boundingBox": {
              "min": [ -1, -1, -1 ],
              "max": [ 1, 1, 1.000001 ]
            },
            "derivatives": [
              {
                "usage": "Web3D",
                "quality": "Highest",
                "assets": [
                  {
                    "uri": "models/baz.glb",
                    "type": "Model",
                    "byteSize": 5500,
                    "numFaces": 12
                  }
                ]
              }
            ],
            "annotations": []
          }
        ])
      });

      it("can upload a usdz model in an existing scene", async function(){
        await this.agent.put("/scenes/foo/models/baz.usdz")
        .send("xxx\n")
        .expect(201);
        let {body:doc} = await this.agent.get("/scenes/foo/document.svx.json").expect(200);
        expect(doc).to.have.property("models").deep.equal([
          {
            "units": "mm",
            "derivatives": [
              {
                "usage": "iOSApp3D",
                "quality": "AR",
                "assets": [
                  {
                    "uri": "models/baz.usdz",
                    "type": "Model",
                    "byteSize": 4
                  }
                ]
              }
            ],
            "annotations": []
          }
        ])
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

      it("can MOVE a file", async function(){
        let props :WriteFileParams = {user_id: 0, scene: "foo", type: "articles", name:"hello-world.html"};
        await vfs.writeFile(dataStream(), props);
        await this.agent.move("/scenes/foo/articles/hello-world.html")
        .set("Destination", "http://localhost:8000/scenes/foo/articles/goodbye-world.html")
        .expect(201);
        await expect(vfs.getFileProps(props), "old file should not exist anymore").to.be.rejectedWith("404");
        await expect(vfs.getFileProps({...props, name: "goodbye-world.html"}), "new file should have been  created").to.be.fulfilled;
      });

      it("MOVE requires a proper Destination header", async function(){
        let props :WriteFileParams = {user_id: 0, scene: "foo", type: "articles", name:"hello-world.html"};
        await vfs.writeFile(dataStream(), props);
        await this.agent.move("/scenes/foo/articles/hello-world.html")
        .expect(400);
      });

      it("MOVE requires a proper Destination header", async function(){
        let props :WriteFileParams = {user_id: 0, scene: "foo", type: "articles", name:"hello-world.html"};
        await vfs.writeFile(dataStream(), props);
        await this.agent.move("/scenes/foo/articles/hello-world.html")
        .expect(400);
      });

      it("can COPY a file", async function(){
        let props :WriteFileParams = {user_id: 0, scene: "foo", type: "articles", name:"hello-world.html"};
        await vfs.writeFile(dataStream(), props);
        await this.agent.copy("/scenes/foo/articles/hello-world.html")
        .set("Destination", "http://localhost:8000/scenes/foo/articles/goodbye-world.html")
        .expect(201);
        await expect(vfs.getFileProps({...props, name: "hello-world.html"}), "old file should still be here").to.be.fulfilled;
        await expect(vfs.getFileProps({...props, name: "goodbye-world.html"}), "new file should have been  created").to.be.fulfilled;
      });

      it("can COPY with a label to restore a file version", async function(){
        let props :WriteFileParams = {user_id: user.uid, scene: "foo", type: "articles", name:"hello-world.html"};
        let {ctime:t1, id:id1, generation:g1, ...f} = await vfs.writeFile(dataStream(), props);
        await vfs.writeFile(dataStream(["goodbye world\n"]), props);
        await this.agent.copy("/scenes/foo/articles/hello-world.html")
        .set("Destination", "http://localhost:8000/scenes/foo/articles/hello-world.html")
        .set("Label", f.hash)
        .expect(201);
        let {ctime:t2, id:id2, generation:g2, ...new_file} = await expect(vfs.getFileProps({...props, name: "hello-world.html"}), "file should still be here").to.be.fulfilled;
        expect(id2).not.to.equal(id1);
        expect(g2).to.equal(3);
        expect(new_file).to.deep.equal(f);
      });

      it("can COPY a document", async function(){
        let {id:scene_id} = await vfs.getScene("foo");
        await vfs.writeDoc('{"id":2}', "foo", user.uid);
        let {ctime:t1, id, generation, ...src} = await vfs.getDoc(scene_id);
        await vfs.writeDoc('{"id":3}', "foo", user.uid);

        await this.agent.copy("/scenes/foo/scene.svx.json")
        .set("Destination", "http://localhost:8000/scenes/foo/scene.svx.json")
        .set("Label", generation)
        .expect(201);
        let {ctime:t2, id:id2, generation:g2, ...new_doc} = await expect(vfs.getDoc(scene_id), "file should still be here").to.be.fulfilled;
        expect(id2).not.to.equal(id);
        expect(g2).to.equal(4);
        expect(new_doc).to.deep.equal(src);
      });

      it("can't COPY a document to another scene", async function(){
        await this.agent.copy("/scenes/foo/scene.svx.json")
        .set("Destination", "http://localhost:8000/scenes/bar/scene.svx.json")
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

      it("can't fetch user list", async function(){
        await this.agent.get("/api/v1/users")
        .expect(401);
      });

      it("can't create a user", async function(){
        await this.agent.post("/api/v1/users")
        .expect(401);
      });
      it("can't remove a user", async function(){
        await this.agent.delete(`/api/v1/users/${user.uid}`)
        .expect(401);
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

  describe("(administrator)", function(){
    this.beforeEach(async function(){
      this.agent = request.agent(this.server);
      await this.agent.post("/api/v1/login")
      .send({username: admin.username, password: "12345678"})
      .set("Content-Type", "application/json")
      .set("Accept", "")
      .expect(200);
    });

    it("can get a list of users", async function(){
      let res = await this.agent.get("/api/v1/users")
      .set("Accept", "application/json")
      .expect(200);
      expect(res.body).to.have.property("length", 2);
      for(let user of res.body){
        expect(user).to.have.property("username").a("string");
        expect(user).to.have.property("uid").a("number").above(1);
        expect(user).not.to.have.property("password");
      }
    })

    it("can create a user", async function(){
      await this.agent.post("/api/v1/users")
      .set("Content-Type", "application/json")
      .send({username: "Carol", password: "abcdefghij", isAdministrator: false})
      .expect(200);
    });

    it("can create an admin", async function(){
      await this.agent.post("/api/v1/users")
      .set("Content-Type", "application/json")
      .send({username: "Dave", password: "abcdefghij", isAdministrator: true})
      .expect(200);
    });

    it("can't provide bad data'", async function(){
      await this.agent.post("/api/v1/users")
      .set("Content-Type", "application/json")
      .send({username: "Oscar", password: "abcdefghij", isAdministrator: "foo"})
      .expect(400);
    });
    it("can remove a user", async function(){
      let users = await (await userManager.getUsers()).length;
      await this.agent.delete(`/api/v1/users/${user.uid}`)
      .expect(204);
      expect(await userManager.getUsers()).to.have.property("length",users - 1);
    });
    it("can't remove himself", async function(){
      let users = await (await userManager.getUsers()).length;
      await this.agent.delete(`/api/v1/users/${admin.uid}`)
      .expect(400);
      expect(await userManager.getUsers()).to.have.property("length",users);
    });
    it("will cleanup files created by a removed user", async function(){
      let props :WriteFileParams= {scene:"foo", type:"models", name: "foo.glb", user_id: user.uid}
      let scene = await vfs.createScene("foo", user.uid);
      let doc_id = await vfs.writeDoc("{}", scene, user.uid);
      expect(await userManager.getPermissions(scene)).to.deep.equal([
        {uid: 0, username: "default", access: "read"},
        {uid:1, username: "any", access: "read"},
        {uid: user.uid, username: user.username, access: "admin"},
      ]);
      let f = await vfs.createFile(props, {hash: "xxxxxx", size:10});
      await this.agent.delete(`/api/v1/users/${user.uid}`)
      .expect(204);
      expect(await vfs.getFileProps(props)).to.have.property("author", "default");
      expect(await userManager.getPermissions(scene)).to.deep.equal([
        {uid: 0, username: "default", access: "read"},
        {uid:1, username: "any", access: "read"},
      ]);
    });
  });
})
