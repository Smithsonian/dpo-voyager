
import fs from "fs/promises";
import path from "path";
import os from "os";
import { expect } from "chai";
import importAll,{getType } from "./import";
import openDatabase, { Database } from "./db";

describe("import", function(){
  describe("importAll()", function(){
    let srcDir :string, outDir :string;
    let db :Database;
    this.beforeEach(async function(){
      this.dir = await fs.mkdtemp(path.join(os.tmpdir(), "ethesaurus-import-tests"));
      srcDir = path.join(this.dir, "source");
      outDir = path.join(this.dir, "dest");
      await Promise.all([
        fs.mkdir(srcDir),
        fs.mkdir(path.join(outDir, "uploads"), {recursive: true}),
        fs.mkdir(path.join(outDir, "objects"), {recursive: true}),
      ]);
      db = await openDatabase({filename: path.join(outDir, "database.db"), migrate: false});
    });
    this.afterEach(async function(){
      await db.close();
      await fs.rm(this.dir, {recursive: true});
    });
  
    it("imports a scene", async function(){
      let modelDir = path.join(srcDir, "models", "foo");
      await fs.mkdir(path.join(modelDir, "media/articles"), {recursive: true});
      await Promise.all([
        fs.writeFile(path.join(modelDir, "foo.svx.json"), "{}"),
        fs.writeFile(path.join(modelDir, "foo.glb"), "xxx\n"),
        fs.writeFile(path.join(modelDir, "foo-thumb.jpg"), "xxx\n"),
        fs.writeFile(path.join(modelDir, "media/articles/introduction.html"), "xxx\n"),
      ]);
      let stats = await importAll(srcDir, outDir);
      expect(stats.models).to.deep.equal([{
        models: 1,
        images: 1,
        articles: 1,
      }]);
      let models = await db.all(`SELECT * FROM scenes`);
      expect(models).to.have.property("length", 1);
      let files = await db.all(`SELECT * FROM files`);
      expect(files).to.have.property("length", 3);
    });
    it("imports a user", async function(){
      await fs.mkdir(path.join(srcDir, "secrets"));
      await fs.writeFile(path.join(srcDir, "secrets", "users.index"), 
        `foo:mwy8fkc8GQdT:true:$scrypt$N=16$r=2$p=1$salt$LujVzsDpII5VRQoJQw_Qjw`
      );
      let stats = await expect(importAll(srcDir, outDir)).to.be.fulfilled;
      expect(stats).to.have.property("users", 1);
      let users = await db.all(`SELECT * FROM users`);
      expect(users).to.have.property("length", 2);
      expect(users[0]).to.have.property("username", "default");
      expect(users[1]).to.have.property("username", "foo");
      expect(users[1]).to.have.property("password", "$scrypt$N=16$r=2$p=1$salt$LujVzsDpII5VRQoJQw_Qjw");
    });

    describe("handle special data", function(){
      let modelDir :string;
      this.beforeEach(async function(){
        modelDir = path.join(srcDir, "models", "foo");
        await fs.mkdir(path.join(modelDir, "media/articles"), {recursive: true});
        await Promise.all([
          fs.writeFile(path.join(modelDir, "foo.svx.json"), "{}"),
        ]);
      });
      it("rejects models without a model.svx.json file", async function(){
        await fs.rm(path.join(modelDir, "foo.svx.json"));
        await expect(importAll(srcDir, outDir)).to.be.rejectedWith("Failed to import model foo");
        let models = await db.all(`SELECT * FROM scenes`);
        expect(models).to.have.property("length", 0);
      });
      it("skips *.sav and *.bak files", async function(){
        await fs.writeFile(path.join(modelDir, "foo.svx.json.bak"), "{}");
        await fs.writeFile(path.join(modelDir, "foo.svx.json.back"), "{}");
        await fs.writeFile(path.join(modelDir, "foo.svx.json.sav"), "{}");
        let stats = await expect(importAll(srcDir, outDir)).to.be.fulfilled;
        expect(stats.models).to.deep.equal([{
          models: 0,
          images: 0,
          articles: 0,
        }]);
      });
      it("imports articles that are saved without an extension", async function(){
        await fs.mkdir(path.join(modelDir, "media/articles"), {recursive: true});
        await fs.writeFile(path.join(modelDir, "media/articles/foo"), "xxx\n");
        let stats = await importAll(srcDir, outDir);
        expect((stats as any).models).to.deep.equal([{
          models: 0,
          images: 0,
          articles: 1,
        }]);
      });
    });
  });
  
  
  describe("getType()", function(){
    it("tests files extensions", function(){
      expect(getType("/path/to/foo.glb")).to.equal("models");
      expect(getType("/path/to/foo.GLB")).to.equal("models");
      expect(getType("/path/to/foo.jpg")).to.equal("images");
    });
    it("anything in media/articles/* is an article", function(){
      expect(getType("/path/to/foo/media/articles/introduction")).to.equal("articles");
    });
  });
})
