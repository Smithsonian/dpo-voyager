
import fs from "fs/promises";
import path from "path";
import {tmpdir} from "os";
import {expect} from "chai";

import uid, { Uid } from "./uid"
describe("uid()", function(){
  it("generates unique fixed-length names", function(){
    for(let i=0; i <100; i++){
      expect(uid(12)).to.match(/^[a-zA-Z0-9]{12}$/);
    }
  });
  it("matches requested size", function(){
    for(let i=1; i <100; i++){
      expect(uid(i)).to.have.property("length", i);
    }
  });
});


describe("Uid", function(){
  it("converts a number to a string", function(){
    expect(Uid.toString(0)).to.equal("AAAAAAAA");
    expect(Uid.toString(1)).to.equal("AAAAAAAB");
  })
  it("converts a string to a number", function(){
    expect(Uid.toNumber("AAAAAAAB")).to.equal(1);
  })
  it("converts back and forth", function(){
    [1, 1000, 123456789].forEach(function(n){
      let s = Uid.toString(n);
      expect(Uid.toNumber(s)).to.equal(n);
    })
  });
  it("rejects number < 0", function(){
    expect(()=>Uid.toString(-1)).to.throw("Bad ID");
  });
  it("rejects numbers > 2^53", function(){
    expect(()=>Uid.toString(2**53)).to.throw("Bad ID");
  });
  it("rejects strings that doesn't map to an uint", function(){
    expect(()=>Uid.toNumber("AAAAAAAAAA")).to.throw("Bad ID");
    expect(()=>Uid.toNumber("AA")).to.throw("Bad ID");
  });
  it("Generates numeric IDs", function(){
    expect(Uid.make()).to.be.a("number");
  });
  it("generated IDs are safe for conversion", function(){
    for(let i = 0; i < 100; i++){
      let u = Uid.make();
      let s = Uid.toString(u);
      expect(Uid.toNumber(s)).to.equal(u);
    }
  });
});