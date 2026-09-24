import { expect } from "chai";

import DocumentValidator from "client/io/DocumentValidator";
import defaultDocument from "client/templates/default.svx.json";

(global as any).ENV_DEVELOPMENT = false;


describe("DocumentValidator", function(){
  function withOrbit(orbit: any)
  {
    const document = JSON.parse(JSON.stringify(defaultDocument));
    Object.assign(document.setups[0].navigation.orbit, orbit);
    return document;
  }

  let validator: DocumentValidator;
  let warn: typeof console.warn;
  this.beforeEach(function(){
    validator = new DocumentValidator();
    warn = console.warn;
    console.warn = () => {};
  });
  this.afterEach(function(){
    console.warn = warn;
  });

  it("validates the default document", function(){
    expect(validator.validate(defaultDocument as any)).to.be.true;
  });

  it("validates an orbit pivot", function(){
    expect(validator.validate(withOrbit({ pivot: [ 1, 2, 3 ] }))).to.be.true;
  });

  it("rejects malformed orbit values", function(){
    expect(validator.validate(withOrbit({ pivot: [ 1, 2 ] }))).to.be.false;
    expect(validator.validate(withOrbit({ pivot: [ 1, null, 3 ] }))).to.be.false;
    expect(validator.validate(withOrbit({ minOrbit: [ "a", null, null ] }))).to.be.false;
  });
});
