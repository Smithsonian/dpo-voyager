
import request from "supertest";
import Vfs from "../../../vfs";
import User from "../../../auth/User";
import UserManager from "../../../auth/UserManager";



describe("/api/v1/login", function(){
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
