import {ClientRequest} from "http"
import {once} from "events";
import {Readable} from "stream";
import timers from "node:timers/promises";

import request from "supertest";
import User from "../../../auth/User";
import UserManager from "../../../auth/UserManager";
import Vfs from "../../../vfs";



describe("GET /scenes/:scene/:filename(.*)", function(){
  
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

  it("can get a public scene's file", async function(){
    let scene_id = await vfs.createScene("foo", {"0":"read"});
    await vfs.writeDoc("{}", scene_id, user.uid);
    await vfs.writeFile(dataStream(), {scene: "foo", mime:"model/gltf-binary", name: "models/foo.glb", user_id: user.uid});

    await request(this.server).get("/scenes/foo/models/foo.glb")
    .expect(200)
    .expect("Content-Type", "model/gltf-binary")
    .expect("foo\n");
  });

  it("can't get a private scene's file", async function(){
    let scene_id = await vfs.createScene("foo", {"0":"none", [user.uid]: "admin"});
    await vfs.writeDoc("{}", scene_id, user.uid);
    await vfs.writeFile(dataStream(), {scene: "foo", mime:"model/gltf-binary", name: "models/foo.glb", user_id: user.uid});

    await request(this.server).get("/scenes/foo/models/foo.glb")
    .expect(401);
  });

  it("can get an owned scene's file", async function(){
    let scene_id = await vfs.createScene("foo", {"0":"none", [user.uid]: "admin"});
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
    let scene_id = await vfs.createScene("foo", {"0":"read", [user.uid]: "admin"});
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

  it("can abort responses", async function(){
    await vfs.createScene("foo", {"0":"write"});

    let orig = vfs.getFile;
    let stream = (Readable.from(["hello", "world", "\n"]) as any).map((s:string)=>new Promise(r=>setTimeout(()=>r(s), 4)));
    let d = stream.destroy;
    let calls:Array<Error|undefined> = [];
    stream.destroy = function(e :Error|undefined){
      calls.push(e);
      return d.call(stream, e);
    }
    try{
      vfs.getFile = (()=>Promise.resolve({
        id: 1,
        name: "models/foo.glb",
        hash: "tbudgBSg-bHWHiHnlteNzN8TUvI80ygS9IULh4rklEw",
        generation: 1,
        size: 10,
        mtime: new Date("2023-04-13T09:03:21.506Z"),
        ctime: new Date("2023-04-13T09:03:21.506Z"),
        mime: "model/gltf-binary",
        author_id: 0,
        author: "default",
        stream,
      }));

      let test = request(this.server).get("/scenes/foo/models/foo.glb")
      .buffer(false)
      .send();
      setTimeout(()=>(test as any).req.socket.end(), 5);
      let [err] = await Promise.all([
        once(stream, "close").catch(e=>e),
        expect(test).to.be.rejectedWith(/socket hang up/),
      ]);
      expect(err).to.have.property("code", "ERR_STREAM_PREMATURE_CLOSE");
      expect(calls, "stream.destroy() should be called on aborted requests").to.have.property("length", 1);

    }finally{
      vfs.getFile = orig;
    }

  });

});
