import { expect } from "chai";

import { formatNumber } from "client/utils/assetStats";


describe("formatNumber", function(){
  // Numbers are formatted with the machine's locale: only compare what has no decimal separator
  it("leaves numbers below 1000 as they are", function(){
    expect(formatNumber(0)).to.equal("0");
    expect(formatNumber(999)).to.equal("999");
  });

  it("shortens large numbers with an SI prefix", function(){
    expect(formatNumber(1000)).to.equal("1k");
    expect(formatNumber(123_456)).to.equal("123k");
    expect(formatNumber(4e9)).to.equal("4G");
  });

  it("handles negative numbers", function(){
    expect(formatNumber(-45_000)).to.equal("-45k");
  });

  it("separates a unit from the number with a space", function(){
    expect(formatNumber(512, {unit: "B"})).to.equal("512 B");
    expect(formatNumber(2_000_000, {unit: "B"})).to.equal("2 MB");
  });

  it("stops at the largest prefix", function(){
    expect(formatNumber(1e21).endsWith("E")).to.be.true;
  });

  it("returns non-finite numbers as text", function(){
    expect(formatNumber(NaN)).to.equal("NaN");
  });
});
