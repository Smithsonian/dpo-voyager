import { expect } from "chai"
import { addDerivative, addModel, Asset, Document } from "./edit"



function dummy(rest:Partial<Asset>={}) :Asset{
  return {
    name : "foo.glb",
    uri : "foo/foo.glb",
    usage : "Web3D",
    quality: "Highest",
    ...rest
  }
}

describe("edit scene documents", function(){
  describe("addDerivative", function(){
    it("create a model if none exist", function(){
      let doc = addDerivative(dummy());
      expect(doc).to.have.property("models").to.have.length(1);
      expect(doc.models[0].derivatives).to.have.property("length", 1);
    });
    describe("with a model", function(){
      let doc :Document;
      this.beforeEach(function(){
        doc = addDerivative(dummy());
      })
      it("adds a derivative", function(){
        let v2 = addDerivative(dummy({name: "bar.glb", uri:"foo/bar.glb", quality: "Low"}), doc);
        expect(v2).to.have.property("models").to.have.length(1);
        expect(v2.models[0].derivatives).to.deep.equal([
          {"usage":"Web3D","quality":"Highest","assets":[
            {"uri":"foo/foo.glb","type":"Model"}
          ]},
          {"usage":"Web3D","quality":"Low","assets":[
            {"uri":"foo/bar.glb","type":"Model"}
          ]}
        ]);
      });
      it("merge existing assets", function(){
        let v2 = addDerivative(dummy({quality:"AR"}), doc);
        expect(v2.models[0]).to.have.property("derivatives").deep.equal([
          {"usage":"Web3D","quality":"AR","assets":[
            {"uri":"foo/foo.glb","type":"Model"}
          ]}
        ])
      })
    })
  })
})