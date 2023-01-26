import fs from "fs/promises";
import os from "os";
import timers from "timers/promises";
import { expect } from "chai";
import open, { Database } from "./db"
import path from "path";
import uid from "../../utils/uid";


describe("Database.beginTransaction()", function(){
  let db :Database;
  this.beforeEach(async function(){
    db = await open({
      filename: path.join(os.tmpdir(),`${(this.currentTest as any).title.replace(/[^a-zA-Z0-9]/g,"-")}-${uid(5)}.db`),
      migrate:"force",
    });
    await db.exec(`
      CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT UNIQUE);
      INSERT INTO test (name) VALUES ("foo");
    `);
  });
  this.afterEach(async function(){
    try{
      await db.close(); //Otherwise, it leaks

    }catch(e){
      if(!/Database is closed/.test((e as any).message)){
        throw e;
      }
    }
    await fs.rm(db.config.filename);
  });

  it("migrations are indempotent", async function(){
    let config = db.config;
    await db.close();
    db = await open({
      ...config,
      migrate: "force"
    });
  });

  it("opens and makes a transaction", async function(){
    await expect(db.beginTransaction(async (tr)=>{
      await tr.exec(`INSERT INTO test (name) VALUES ("bar")`);
      return await tr.all(`SELECT * FROM test`);
    })).to.eventually.have.property("length", 2);
    await expect(db.all(`SELECT * FROM test`)).to.eventually.have.property("length", 2);
  });

  it("rollbacks when an error occurs", async function(){
    await expect(db.beginTransaction(async (tr)=>{
      await tr.exec(`INSERT INTO test (name) VALUES ("bar")`);
      await tr.exec(`INSERT INTO test (name) VALUES ("foo")`); //UNIQUE VIOLATION
    })).to.be.rejectedWith("SQLITE_CONSTRAINT: UNIQUE");
    await expect(db.all(`SELECT * FROM test`)).to.eventually.have.property("length", 1);
  });

  it("provides isolation to parent db", async function(){
    let p;
    let length = (await db.all(`SELECT * FROM test`)).length
    await expect(db.beginTransaction(async (tr)=>{
      await tr.exec(`INSERT INTO test (name) VALUES ($val)`,{$val:"bar"});
      p = await db.all(`SELECT * FROM test`)
    })).to.be.fulfilled;
    expect(p).to.have.property("length", length);
  });
  it("provides isolation from parent db", async function(){
    let p;
    await expect(db.beginTransaction(async (tr)=>{
      await tr.get("SELECT * FROM test") // makes the transaction explicit
      p = db.exec(`INSERT INTO test (name) VALUES ("bar")`)
      return await tr.all(`SELECT name FROM test`);
    })).to.eventually.deep.equal([{name: "foo"}]);
    await expect(p).to.be.fulfilled;
  });
})