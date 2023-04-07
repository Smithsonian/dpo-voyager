
import request from "supertest";
import User from "../../../auth/User";
import UserManager from "../../../auth/UserManager";
import { NotFoundError } from "../../../utils/errors";
import Vfs from "../../../vfs";



describe("PUT /scenes/:scene/:filename(.*)", function(){
  
  let vfs :Vfs, userManager :UserManager, user :User, admin :User, scene_id :number;

  this.beforeEach(async function(){
    let locals = await createIntegrationContext(this);
    vfs = locals.vfs;
    userManager = locals.userManager;
    user = await userManager.addUser("bob", "12345678");
    admin = await userManager.addUser("alice", "12345678", true);
    scene_id = await vfs.createScene("foo", {"0":"write", [user.uid]: "admin"});
    await vfs.writeDoc("{}", scene_id, user.uid);

  });
  this.afterEach(async function(){
    await cleanIntegrationContext(this);
  });

  it("can PUT a file into a scene", async function(){

    await request(this.server).put("/scenes/foo/articles/foo.html")
    .set("Content-Type", "text/plain")
    .expect(201);
    let {ctime, mtime, ...file} =  await vfs.getFileProps({scene:"foo", name:"articles/foo.html"});
    expect(file).to.deep.equal({
      id: 3,
      size: 0,
      hash: '47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU',
      generation: 1,
      name: 'articles/foo.html',
      mime: 'text/html',
      author_id: 0,
      author: 'default'
    });
    expect(mtime).to.be.instanceof(Date);
    expect(ctime).to.be.instanceof(Date);
  });

  it("can put an extensionless file with proper headers", async function(){

    await request(this.server).put("/scenes/foo/articles/foo")
    .set("Content-Type", "text/html")
    .expect(201);
    let {ctime, mtime, ...file} =  await vfs.getFileProps({scene:"foo", name:"articles/foo"});
    expect(file).to.deep.equal({
      id: 3,
      size: 0,
      hash: '47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU',
      generation: 1,
      name: 'articles/foo',
      mime: 'text/html',
      author_id: 0,
      author: 'default'
    });
  });

  it("requires write permission", async function(){
    await userManager.grant("foo", "default", "read");

    await request(this.server).put("/scenes/foo/articles/foo.html")
    .set("Content-Type", "text/html")
    .expect(401);

    await expect(vfs.getFileProps({scene: "foo", name:"articles/foo.html"})).to.be.rejectedWith(NotFoundError);
  });

});
