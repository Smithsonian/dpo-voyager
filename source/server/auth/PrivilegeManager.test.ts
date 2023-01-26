import { expect } from "chai"
import PrivilegeManager from "./PrivilegeManager"
import User from "./User"



describe("PrivilegeManager", function(){
  describe("subst", function(){
    it("defaults contains no bad substitution", function(){
      for(let role of Object.values(PrivilegeManager.defaults)){
        for(let key of Object.keys(role)){
          expect(()=>PrivilegeManager.subst(key, User.createDefault())).not.to.throw();
        }
      }
    });
    it("keeps bad substitutions", function(){
      expect(PrivilegeManager.subst("{foo}.json", User.createDefault())).to.equal("{foo}.json")
    })
  })
})