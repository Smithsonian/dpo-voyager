
import request from "supertest";
import Vfs from "../../../../../../vfs";
import User from "../../../../../../auth/User";
import UserManager from "../../../../../../auth/UserManager";
import { randomBytes } from "crypto";





describe("POST /api/v1/scenes/:scene/history/:id", function(){
  let vfs :Vfs, userManager :UserManager, user :User, admin :User;
  let titleSlug :string, scene_id :number;

  /**
   * antidate everything currently in the database to force proper ordering
   */
  async function antidate(){
    let ts = Math.round(Date.now()/1000)-10000;
    let d = new Date(ts*1000);
    await vfs._db.exec(`
      UPDATE scenes SET ctime = datetime("${d.toISOString()}");
      UPDATE documents SET ctime = datetime("${d.toISOString()}");
      UPDATE files SET ctime = datetime("${d.toISOString()}");
    `);
  }

  this.beforeAll(async function(){
    let locals = await createIntegrationContext(this);
    vfs = locals.vfs;
    userManager = locals.userManager;
    user = await userManager.addUser("bob", "12345678");
    admin = await userManager.addUser("alice", "12345678", true);
  });
  this.afterAll(async function(){
    await cleanIntegrationContext(this);
  });

  this.beforeEach(async function(){
    //Initialize a unique scene for each test
    titleSlug = this.currentTest?.title.replace(/[^\w]/g, "_").slice(0,15)+"_"+randomBytes(4).toString("base64url");
    scene_id = await vfs.createScene(titleSlug);
  });

  it("restores a scene's document to a specific point in time", async function(){
    let ids :number[] = [];
    for(let i = 0; i < 5; i++){
      ids.push(await vfs.writeDoc(`{"id": ${i}}`, scene_id));
    }
    let point = ids[2];
    let {data} = await vfs.getDocById(point);
    await antidate();

    let res = await request(this.server).post(`/api/v1/scenes/${titleSlug}/history/${point.toString(10)}`)
    .expect("Content-Type", "application/json; charset=utf-8")
    .expect(200);
    expect(res.body).to.have.property("changes", 1);

    let docs = await vfs.getDocHistory(scene_id);
    expect(docs).to.have.property("length", 6);
    let doc = docs[0];
    expect(doc).to.have.property("generation", 6);
    expect(doc).to.have.property("data", data);
  });

  it("restores other files in the scene", async function(){
    await vfs.writeDoc(`{"id": 1}`, scene_id);
    let ref = await vfs.writeFile(dataStream(["hello"]), {type: "articles", name:"hello.txt", scene: scene_id, user_id: user.uid });
    await antidate(); //otherwise ordering of files of different names with the same timestamp is unclear
    await vfs.writeDoc(`{"id": 2}`, scene_id);
    await vfs.writeFile(dataStream(["world"]), {type: "articles", name:"hello.txt", scene: scene_id, user_id: user.uid });

    let res = await request(this.server).post(`/api/v1/scenes/${titleSlug}/history/${ref.id.toString(10)}`)
    .expect("Content-Type", "application/json; charset=utf-8")
    .expect(200);
    expect(res.body).to.have.property("changes", 2);
    let doc = await vfs.getDoc(scene_id);
    expect(doc).to.have.property("data", `{"id": 1}`);
    expect(await vfs.getFileProps({name: "hello.txt", type: "articles", scene: scene_id})).to.have.property("hash", ref.hash);
  });

  it("delete a file if needed", async function(){
    let id = await vfs.writeDoc(`{"id": 1}`, scene_id);
    await vfs.writeFile(dataStream(["hello"]), {type: "articles", name:"hello.txt", scene: scene_id, user_id: user.uid });
    let ref = await vfs.getDocById(id);
    
    let res = await request(this.server).post(`/api/v1/scenes/${titleSlug}/history/${id.toString(10)}`)
    .expect("Content-Type", "application/json; charset=utf-8")
    .expect(200);
    expect(res.body).to.have.property("changes", 1);

    let doc = await vfs.getDoc(scene_id);
    expect(doc).to.deep.equal(ref);

    let allFiles = await vfs.listFiles(scene_id, true);
    expect(allFiles).to.have.property("length", 1);
    expect(allFiles[0]).to.have.property("hash", null);
    expect(allFiles[0]).to.have.property("size", 0);
  });

  it("restore a file to deleted state", async function(){
    await vfs.writeDoc(`{"id": 1}`, scene_id);
    await vfs.writeFile(dataStream(["hello"]), {type: "articles", name:"hello.txt", scene: scene_id, user_id: user.uid });
    let ref = await  vfs.createFile({type: "articles", name:"hello.txt", scene: scene_id, user_id: user.uid }, {hash: null, size: 0});
    await vfs.writeFile(dataStream(["world"]), {type: "articles", name:"hello.txt", scene: scene_id, user_id: user.uid });

    let allFiles = await vfs.listFiles(scene_id, true);
    expect(allFiles).to.have.property("length", 1);
    expect(allFiles[0]).to.have.property("hash" ).ok;

    let res = await request(this.server).post(`/api/v1/scenes/${titleSlug}/history/${ref.id.toString(10)}`)
    .expect("Content-Type", "application/json; charset=utf-8")
    .expect(200);
    expect(res.body).to.have.property("changes", 1);


    allFiles = await vfs.listFiles(scene_id, true);
    expect(allFiles).to.have.property("length", 1);
    expect(allFiles[0]).to.have.property("hash", null);
    expect(allFiles[0]).to.have.property("size", 0);
    expect(allFiles[0]).to.have.property("generation", 4);

  });

  it("refuses to delete a document", async function(){
    let ref = await vfs.writeFile(dataStream(["hello"]), {type: "articles", name:"hello.txt", scene: scene_id, user_id: user.uid });
    await antidate();
    await vfs.writeDoc(`{"id": 1}`, scene_id);

    let res = await request(this.server).post(`/api/v1/scenes/${titleSlug}/history/${ref.id.toString(10)}`)
    .expect("Content-Type", "application/json; charset=utf-8")
    .expect(400);
    
    expect(await vfs.getDoc(scene_id)).to.have.property("data", `{"id": 1}`);
  });


});
