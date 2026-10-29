import { expect } from "chai";

import { createDocumentData, createExplorer, IExplorer, sceneEvents } from "../helpers/explorer";


describe("Initial scene load", function(){
  let explorer: IExplorer;

  beforeEach(function(){
    explorer = createExplorer();
  });

  /** Loads "scene.svx.json", serving it with the given models. */
  async function load(...models: Parameters<typeof createDocumentData>[0]) {
    explorer.responses.set("scene.svx.json", createDocumentData(models));
    const loading = explorer.app.loadDocument("scene.svx.json");
    await explorer.settle();
    return loading;
  }

  it("dispatches scene-load once every model loaded the quality it was asked for", async function(){
    explorer.responses.set("a-Thumb.glb", "model");
    explorer.responses.set("a-High.glb", "model");
    explorer.responses.set("b-High.glb", "model");
    await load({ name: "a", qualities: [ "Thumb", "High" ] }, { name: "b" });

    expect(sceneEvents(explorer)).to.deep.equal([ "scene-load" ]);
    expect(explorer.document.setup.viewer.outs.sceneLoaded.value).to.be.true;
    expect(explorer.assetManager.outs.initialLoad.value).to.be.false;
  });

  it("dispatches scene-error when a model has nothing to display", async function(){
    const error = new Error("broken model");
    explorer.responses.set("a-High.glb", "model");
    explorer.responses.set("b-High.glb", error);
    await load({ name: "a" }, { name: "b" });

    expect(explorer.events.map(event => event.type)).to.include("model-error");
    expect(sceneEvents(explorer)).to.deep.equal([ "scene-error" ]);
    expect(explorer.events.find(event => event.type === "scene-error").detail).to.equal(error);
    expect(explorer.document.setup.viewer.outs.sceneLoaded.value).to.be.false;
    expect(explorer.assetManager.outs.initialLoad.value).to.be.false;
  });
});
