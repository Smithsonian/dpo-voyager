import { expect } from "chai";

import { EDerivativeQuality } from "client/schema/model";
import {getQuality, maxCenterWeight} from "client/components/CVDerivativesController";
import { Box3, Vector3 } from "three";


describe("getQuality", function(){

  it("Selects a quality level", function(){
    expect(getQuality(EDerivativeQuality.Thumb, 1)).to.equal(EDerivativeQuality.High);
    expect(getQuality(EDerivativeQuality.Thumb, 0)).to.equal(EDerivativeQuality.Thumb);
  });
  it("uses an hysteresis (downgrade first)", function(){
    expect(getQuality(EDerivativeQuality.Thumb, 0.11)).to.equal(EDerivativeQuality.Low);
    expect(getQuality(EDerivativeQuality.Medium, 0.11)).to.equal(EDerivativeQuality.Medium);
    expect(getQuality(EDerivativeQuality.Thumb, 0.13)).to.equal(EDerivativeQuality.Medium);
  });
});


describe("maxCenterWeight", function(){
  it("returns 1 for a box that crosses the center", function(){
    let b = new Box3(new Vector3(-1,-1,-1), new Vector3(1, 1, 1));
    expect(maxCenterWeight(b)).to.equal(1);
  });
  it("returns 1/2 for just-out-of-screen objects", function(){
    let b = new Box3(new Vector3(1,0,0), new Vector3(2, 1, 0));
    expect(maxCenterWeight(b)).to.equal(0.5);
  });
})