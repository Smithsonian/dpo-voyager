import { crc32 } from "./crc32";

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