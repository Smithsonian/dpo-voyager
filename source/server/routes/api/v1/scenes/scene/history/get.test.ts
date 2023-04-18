
import request from "supertest";
import Vfs from "../../../../../../vfs";
import User from "../../../../../../auth/User";
import UserManager from "../../../../../../auth/UserManager";



/**
 * Minimal tests as most
 */

describe("GET /api/v1/scenes/:scene/history", function(){
  let vfs :Vfs, userManager :UserManager, user :User, admin :User;

  describe("with sample data", function(){
    let now :Date, scene_id :number;
    this.beforeAll(async function(){
      let locals = await createIntegrationContext(this);
      vfs = locals.vfs;
      userManager = locals.userManager;
      user = await userManager.addUser("bob", "12345678");
      admin = await userManager.addUser("alice", "12345678", true);

      now = new Date();
      now.setMilliseconds(0); //ms are rounded inside sqlite
      scene_id = await vfs.createScene("foo", user.uid);
      await Promise.all([
        vfs.writeFile(dataStream(), {scene: "foo", name:"articles/foo.txt", mime:"text/plain", user_id: user.uid}),
        vfs.writeDoc("{}", "foo", user.uid),
      ]);
      await vfs.removeFile({scene: "foo", name:"articles/foo.txt", mime:"text/plain", user_id: user.uid});
      await vfs.writeFile(dataStream(), {scene: "foo", name:"articles/foo.txt", mime:"text/plain", user_id: user.uid});


      //Ensure proper dates
      await vfs._db.exec(`
        UPDATE files SET ctime = datetime("${now.toISOString()}");
        UPDATE documents SET ctime = datetime("${now.toISOString()}");
      `);
    });
  
    this.afterAll(async function(){
      await cleanIntegrationContext(this);
    });

    it("get a scene's history", async function(){
      let res = await request(this.server).get("/api/v1/scenes/foo/history")
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", "application/json; charset=utf-8");

      expect(res.body.map((i:any)=>([i.name, i.generation]))).to.deep.equal([
        ["scene.svx.json", 1],
        ["models", 1],
        ["articles/foo.txt", 3],
        ["articles/foo.txt", 2],
        ["articles/foo.txt", 1],
        ["articles", 1],
      ]);
    });
    it("get text history", async function(){
      let res = await request(this.server).get("/api/v1/scenes/foo/history")
      .set("Accept", "text/plain")
      .expect(200)
      .expect("Content-Type", "text/plain; charset=utf-8");
    });
  })
});
