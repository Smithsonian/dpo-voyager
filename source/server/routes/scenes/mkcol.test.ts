
import request from "supertest";
import { expect } from "chai";

import User from "../../auth/User";
import UserManager from "../../auth/UserManager";
import Vfs from "../../vfs";
import { Element, xml2js } from "xml-js";



describe("MKCOL /scenes/.*", function(){
  let vfs :Vfs, userManager :UserManager, user :User, admin :User, scene_id :number;
  this.beforeEach(async function(){
    let locals = await createIntegrationContext(this);
    vfs = locals.vfs;
    userManager = locals.userManager;
    user = await userManager.addUser("bob", "12345678");
    admin = await userManager.addUser("alice", "12345678", true);

    scene_id = await vfs.createScene("foo", user.uid);
  });
  this.afterEach(async function(){
    await cleanIntegrationContext(this);
  });

  it.skip("can create a folder", async function(){
    await request(this.server).mkcol("/scenes/foo/bar")
    .auth(user.username, "12345678")
    .expect(201);
  });
});
