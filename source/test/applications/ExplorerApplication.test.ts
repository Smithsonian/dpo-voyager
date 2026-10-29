import { expect } from "chai";

import CVModel2 from "client/components/CVModel2";

import { createDocumentData, createExplorer } from "../helpers/explorer";


describe("ExplorerApplication", function(){
  describe("loadDocument()", function(){
    it("loads a document and its models", async function(){
      const explorer = createExplorer();
      explorer.responses.set("scene.svx.json", createDocumentData([ { name: "a" } ]));

      const document = await explorer.app.loadDocument("scene.svx.json");
      await explorer.settle();

      const models = document.getInnerComponents(CVModel2);
      expect(models.map(model => model.ins.name.value)).to.deep.equal([ "a" ]);
      expect(models[0].activeDerivative).to.be.ok;
      expect(explorer.events.map(event => event.type)).to.include("model-load");
    });
  });
});
