import fs, { FileHandle } from "fs/promises"
import { expect } from "chai";
import { GetFileResult } from "../vfs";
import { asyncMap, crc32, zip, ZipEntry, zip_read_eocdr } from "./zip"
import { Readable } from "stream";
import { createHash } from "crypto";
import path from "path";
import { tmpdir } from "os";


function readStream(data=["hello ", "world\n"]){
  return new Readable({
    read(size){
      let b = data.shift();
      if(b) this.push(Buffer.isBuffer(b)?b : Buffer.from(b))
      else this.push(null);
    }
  })
}

describe("crc32", function(){

  it("computes a crc32 sum over a buffer", function(){
    let crc = crc32();
    crc.next(Buffer.from("hello world\n"));
    expect((crc.next().value).toString(16)).to.equal(0xaf083b2d.toString(16));
  });
  it("can be updated", function(){
    let crc = crc32();
    crc.next(Buffer.from("hello "));
    crc.next(Buffer.from("world"));
    crc.next(Buffer.from("\n"));
    expect((crc.next().value).toString(16)).to.equal(0xaf083b2d.toString(16));
  });
});

describe("read zip files", async function(){
  this.beforeAll(async function(){
    this.dir = await fs.mkdtemp(path.join(tmpdir(), "voyager-zipfiles-"));

  });
  this.afterAll(async function(){
    await fs.rm(this.dir, {recursive: true});
  });
  ["", "with comments"].forEach((c)=>{
    describe(c, function(){
      let handle :FileHandle;
      this.beforeAll(async function(){
        let file = path.join(this.dir, "test.zip");
        handle = await fs.open(file, "w+");
        let size = 0
        for await (let b of zip([
          {filename:"media/", isDirectory: true, mtime: new Date(1673450722892)},
          {filename:"media/articles/", isDirectory: true, mtime: new Date(1673450722892)},
          {filename:"media/articles/foo.html", mtime: new Date(1673450722892), stream:readStream()},
        ], {comments: c})){
          await handle.write(b);
          size = size + b.length
        }
      })
  
      this.afterAll(async function(){
        await handle.close();
      });
      it("read end of central directory", async function(){
        let eocdr = await zip_read_eocdr(handle);
        expect(eocdr).to.deep.equal({
          cdr_size: 182,
          cdr_start: 194,
          file_size: 398+Buffer.byteLength(c),
          entries: 3,
          comments: c
        })
      });
      it("read central directory", async function(){
        
      });
    });
  });
})

describe("asyncMap()", function(){
  it("maps an array to an async iterator", async function(){
    let calls = 0;
    let foo = new Array(256);
    let iter = asyncMap(foo, (v)=> Promise.resolve(++calls))
    expect(calls).to.equal(0);
    for(let i = 1; i < foo.length +1; i++){
      let res = await iter.next();
      expect(calls).to.equal(i);
      expect(res).to.have.property("value", i);
      expect(res).to.have.property("done", false);
    }
    expect(await iter.next()).to.have.property("done", true);
  });

  it("can be chained", async function(){
    let input = new Array(10);
    let calls = 0;
    let i1 = asyncMap(input, ()=>Promise.resolve(++calls));
    let i2 = asyncMap(i1, (v)=> Promise.resolve(v*2));
    let count = 0;
    for await (let n of i2){
      expect(n).to.equal(++count * 2);
    }
  })
})