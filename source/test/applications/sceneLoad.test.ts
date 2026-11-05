import { expect } from "chai";
import { Texture } from "three";

import CVModel2 from "client/components/CVModel2";
import { HTTPError } from "client/utils/errors";
import { EDerivativeQuality } from "client/schema/model";

import { createDocumentData, createExplorer, IExplorer, sceneEvents } from "../helpers/explorer";


async function rejection(promise: Promise<unknown>): Promise<Error>
{
  try {
    await promise;
  }
  catch (error) {
    return error;
  }
  throw new Error("expected the promise to reject");
}


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

  describe("with image planes", function(){
    it("waits for their image", async function(){
      explorer.responses.set("a-High.glb", "model");
      explorer.responses.set("p.jpg", "deferred");
      await load({ name: "a" }, { name: "p", image: "p.jpg" });
      expect(sceneEvents(explorer)).to.deep.equal([]);

      explorer.pending.get("p.jpg").resolve(new Texture({ width: 2, height: 1 }));
      await explorer.settle();

      expect(sceneEvents(explorer)).to.deep.equal([ "scene-load" ]);
      expect(explorer.events.map(event => event.type)).to.include("scene-content-load");
    });

    it("dispatches scene-error when their image fails to load", async function(){
      const error = new Error("missing image");
      explorer.responses.set("a-High.glb", "model");
      explorer.responses.set("p.jpg", error);
      await load({ name: "a" }, { name: "p", image: "p.jpg" });

      expect(explorer.events.map(event => event.type)).to.include("model-error");
      expect(sceneEvents(explorer)).to.deep.equal([ "scene-error" ]);
      expect(explorer.events.find(event => event.type === "scene-error").detail).to.equal(error);
    });
  });

  describe("ends every document load", function(){

    it("with scene-error when the document can't be read", async function(){
      const loading = explorer.app.loadDocument("missing.svx.json");
      await explorer.settle();

      const error = await rejection(loading);
      expect(error).to.be.instanceOf(HTTPError).with.property("status", 404);
      expect(sceneEvents(explorer)).to.deep.equal([ "scene-error" ]);
      expect(explorer.events[0].detail).to.equal(error);
    });

    it("with scene-error when the document is invalid", async function(){
      explorer.responses.set("scene.svx.json", { not: "a document" } as any);
      const loading = explorer.app.loadDocument("scene.svx.json");
      await explorer.settle();

      expect((await rejection(loading)).message).to.match(/validation/);
      expect(sceneEvents(explorer)).to.deep.equal([ "scene-error" ]);
    });

    it("without leaving the initial load on after a failure", async function(){
      explorer.app.loadDocument("missing.svx.json").catch(() => {});
      await explorer.settle();

      // the next download must not be mistaken for the initial load
      explorer.assetManager.ins.busy.set();
      explorer.update();
      expect(explorer.assetManager.outs.initialLoad.value).to.be.false;
    });

    it("with scene-load when the document has no model", async function(){
      await load();

      expect(sceneEvents(explorer)).to.deep.equal([ "scene-load" ]);
      expect(explorer.assetManager.outs.initialLoad.value).to.be.false;
    });

    it("with an AbortError when a new load supersedes it while downloading the document", async function(){
      explorer.responses.set("first.svx.json", "deferred");
      explorer.responses.set("second.svx.json", createDocumentData([]));
      const first = explorer.app.loadDocument("first.svx.json");
      const second = explorer.app.loadDocument("second.svx.json");
      await explorer.settle();

      expect((await rejection(first)).name).to.equal("AbortError");
      await second;
      expect(sceneEvents(explorer)).to.deep.equal([ "scene-error", "scene-load" ]);
      expect(explorer.events[0].detail.name).to.equal("AbortError");
    });

    it("with an AbortError when a new load supersedes it while loading models", async function(){
      explorer.responses.set("a-High.glb", "deferred");
      explorer.responses.set("first.svx.json", createDocumentData([ { name: "a" } ]));
      explorer.responses.set("second.svx.json", createDocumentData([]));
      await explorer.app.loadDocument("first.svx.json");
      await explorer.settle();
      expect(sceneEvents(explorer)).to.deep.equal([]);

      await explorer.app.loadDocument("second.svx.json");
      await explorer.settle();

      expect(sceneEvents(explorer)).to.deep.equal([ "scene-error", "scene-load" ]);
      expect(explorer.events.find(event => event.type === "scene-error").detail.name).to.equal("AbortError");
    });

    it("with an AbortError when the document is reloaded, from the replaced document's viewer", async function(){
      explorer.responses.set("a-High.glb", "deferred");
      await load({ name: "a" });
      const replaced = explorer.document;

      explorer.app.reloadDocument();
      await explorer.settle();

      expect(explorer.document).not.to.equal(replaced);
      const errors = explorer.events.filter(event => event.type === "scene-error");
      expect(errors).to.have.length(1);
      expect(errors[0].document).to.equal(replaced);
      expect(errors[0].detail.name).to.equal("AbortError");
      expect(explorer.assetManager.outs.initialLoad.value).to.be.false;
    });

    it("only once", async function(){
      explorer.responses.set("a-Thumb.glb", "model");
      explorer.responses.set("a-High.glb", "model");
      await load({ name: "a", qualities: [ "Thumb", "High" ] });

      // later failures are not part of the initial load, nor is a later supersession
      const model = explorer.document.getInnerComponents(CVModel2)[0];
      explorer.responses.set("a-Thumb.glb", new Error("broken model"));
      model.ins.quality.setValue(EDerivativeQuality.Thumb);
      await explorer.settle();
      explorer.app.reloadDocument();
      await explorer.settle();

      expect(sceneEvents(explorer)).to.deep.equal([ "scene-load" ]);
    });
  });
});
