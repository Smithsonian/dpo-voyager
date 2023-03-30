import fs, { FileHandle } from "fs/promises"
import { expect } from "chai";
import { GetFileResult } from "../../vfs";
import { asyncMap, create_cd_header, flags, parse_cd_header, unzip, zip,  } from "."
import { Readable } from "stream";
import { createHash } from "crypto";
import path from "path";
import { tmpdir } from "os";
import { ReadStream } from "fs";


function readStream(data=["hello ", "world\n"]){
  return new Readable({
    read(size){
      let b = data.shift();
      if(b) this.push(Buffer.isBuffer(b)?b : Buffer.from(b))
      else this.push(null);
    }
  })
}



describe("zip records", function(){
  let cdHeader = {
    filename: "foo.txt",
    extra: "",
    flags: flags.USE_DATA_DESCRIPTOR | flags.UTF_FILENAME,
    size: 128,
    mtime: new Date('2023-03-29T13:02:10.000Z'),
    dosMode: 0x0,
    unixMode: 0o040755,
    crc: 0xaf083b2d,
    offset: 0
  };
  describe("create_cd_header()", function(){
    it("basic create and parse", function(){

      let buf = create_cd_header(cdHeader);
      let {length,...parsed} = parse_cd_header(buf, 0);
      expect(parsed).to.deep.equal(cdHeader);
      expect(length, "there should be no unused bytes").to.equal(buf.length);
    });
    it("with extra", function(){
      let h ={...cdHeader, extra: "hello world"};
      let buf = create_cd_header(h);
      let {length,...parsed} = parse_cd_header(buf, 0);
      expect(parsed).to.deep.equal(h);
      expect(length, "there should be no unused bytes").to.equal(buf.length);
    });
    it("with a folder", function(){
      let h ={...cdHeader, filename: "/foo/", dosMode: 0x10, unixMode: 0o040755 };
      let buf = create_cd_header(h);
      let {length,...parsed} = parse_cd_header(buf, 0);
      expect(parsed).to.deep.equal(h);
      expect(length, "there should be no unused bytes").to.equal(buf.length);
    });
  });

});


class HandleMock{
  data = Buffer.alloc(0);
  constructor(){

  }
  _write(d:Buffer){
    this.data = Buffer.concat([this.data, d]);
  }

  async stat(){
    return Promise.resolve({
      size: this.data.length,
    });
  }
  async read({buffer, position} :{buffer:Buffer, position :number}){
    return Promise.resolve({bytesRead: this.data.copy(buffer, 0, position)});
  }
  /**
   * This is totally fake and unusable but we don't expect to be consuming the read stream for real
   */
  async createReadStream({start, end}:{start:number, end:number}){
    return this.data.slice(start, end);
  }
}


describe("read/write zip files", async function(){

  let files = [
    {filename:"articles/", isDirectory: true, mtime: new Date(1673450722892)},
    {filename:"articles/foo.html", mtime: new Date(1673450722892), stream:readStream()},
  ]

  it("read/write files", async function(){
    let handle = new HandleMock();
    for await (let b of zip(files)){
      handle._write(b);
    }
    let count = 0;
    for await (let file of unzip(handle as any)){
      expect(file).to.have.property("filename", files[count]["filename"]);
      count++;
    }
    expect(count).to.equal(2);
  });
});

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