
import request from "supertest";
import Vfs, { WriteFileParams } from "../../../../vfs";
import User from "../../../../auth/User";
import UserManager from "../../../../auth/UserManager";
import { NotFoundError } from "../../../../utils/errors";



describe("/api/v1/users", function(){
  let vfs :Vfs, userManager :UserManager;
  this.beforeEach(async function(){
    let locals = await createIntegrationContext(this);
    vfs = locals.vfs;
    userManager = locals.userManager;
  });
  this.afterEach(async function(){
    await cleanIntegrationContext(this);
  });

  describe("in open mode", function(){
    it("POST can create a user anonymously", async function(){
      await request(this.server).post("/api/v1/users")
      .send({username:"foo", password:"12345678", email:"foo@example.com", isAdministrator: true})
      .expect(201);
    });
  })

  describe("normal operations", function(){
    let user :User, admin :User;
    this.beforeEach(async function(){
      user = await userManager.addUser("bob", "12345678");
      admin = await userManager.addUser("alice", "12345678", true);
    });

    describe("as user", function(){
      this.beforeEach(async function(){
        this.agent = request.agent(this.server);
        await this.agent.post("/api/v1/login")
        .send({username: user.username, password: "12345678"})
        .set("Content-Type", "application/json")
        .set("Accept", "")
        .expect(200);
      })

      it("can't create a user", async function(){
        await this.agent.post("/api/v1/users")
        .send({username:"foo", password:"12345678", email:"foo@example.com", isAdministrator: true})
        .expect(401);
      });

      it("can't remove a user", async function(){
        await this.agent.delete(`/api/v1/users/${user.uid}`)
        .expect(401);
      });

      it("can patch another user", async function(){
        await this.agent.patch(`/api/v1/users/${admin.uid}`)
        .send({username:"foo"})
        .expect(401);

        expect(await userManager.getUserByName(admin.username)).to.deep.equal(admin);
        expect(userManager.getUserByName("foo")).to.rejectedWith(NotFoundError);
      });

      it("can patch himself", async function(){
        await this.agent.patch(`/api/v1/users/${user.uid}`)
        .send({username:"foo"})
        .expect(200);
        expect(await userManager.getUserByName("foo")).to.be.ok;
        expect(userManager.getUserByName(user.username)).to.rejectedWith(NotFoundError);
      });
      
      it("can't patch himself administrator", async function(){
        await this.agent.patch(`/api/v1/users/${user.uid}`)
        .send({isAdministrator: true})
        .expect(401);

        expect(await userManager.getUserByName(user.username)).to.deep.equal(user);
      });

      it("can't fetch user list", async function(){
        await this.agent.get("/api/v1/users")
        .expect(401);
      });
    });

    describe("as administrator", function(){
      this.beforeEach(async function(){
        this.agent = request.agent(this.server);
        await this.agent.post("/api/v1/login")
        .send({username: admin.username, password: "12345678"})
        .set("Content-Type", "application/json")
        .set("Accept", "")
        .expect(200);
      })
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
        .send({username: "Carol", password: "abcdefghij", isAdministrator: false, email: "carol@foo.com"})
        .expect(201);
      });
  
      it("can create an admin", async function(){
        await this.agent.post("/api/v1/users")
        .set("Content-Type", "application/json")
        .send({username: "Dave", password: "abcdefghij", isAdministrator: true, email: "dave@foo.com"})
        .expect(201);
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
        let props :WriteFileParams= {scene:"foo", mime: "model/gltf-binary", name: "models/foo.glb", user_id: user.uid}
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

      it("can patch a user", async function(){
        await this.agent.patch(`/api/v1/users/${user.uid}`)
        .send({username:"foo"})
        .expect(200);

        expect(await userManager.getUserByName("foo")).to.be.ok;
        expect(userManager.getUserByName(user.username)).to.rejectedWith(NotFoundError);
      });

      it("can patch a user as administrator", async function(){
        await this.agent.patch(`/api/v1/users/${user.uid}`)
        .send({isAdministrator: true})
        .expect(200);

        expect(await userManager.getUserByName(user.username)).to.have.property("isAdministrator", true);
      });

      it("can't patch himself as non-admin", async function(){
        await this.agent.patch(`/api/v1/users/${admin.uid}`)
        .send({isAdministrator: false})
        .expect(401);
      });
    });
  })
});
