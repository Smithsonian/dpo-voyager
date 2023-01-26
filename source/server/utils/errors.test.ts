
import { expect } from "chai";
import * as errorConstructors from "./errors";
describe("errors", function(){
  let {HTTPError, ...defaultConstructors} = errorConstructors;
  Object.entries(defaultConstructors).forEach(([name, Constructor])=>{
    it(`${name} has a default message`, function(){
      let e = new Constructor();
      expect(e).to.have.property("code").a("number");
      expect(e).to.have.property("message").ok;
    })
  })
})