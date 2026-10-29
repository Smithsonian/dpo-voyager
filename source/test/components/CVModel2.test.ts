import { expect } from "chai";
import { Texture } from "three";

import CVModel2 from "client/components/CVModel2";
import CVAssetReader from "client/components/CVAssetReader";
import { EAssetType, EMapType } from "client/schema/model";

import { createDocumentData, createExplorer, Deferred, IExplorer } from "../helpers/explorer";


describe("CVModel2", function(){
  let explorer: IExplorer;
  let model: CVModel2;
  let unhandled: any[];
  const onUnhandled = (reason: any) => unhandled.push(reason);

  beforeEach(async function(){
    unhandled = [];
    process.on("unhandledRejection", onUnhandled);
    explorer = createExplorer();
    explorer.responses.set("scene.svx.json", createDocumentData([ { name: "a" } ]));
    await explorer.app.loadDocument("scene.svx.json");
    await explorer.settle();
    model = explorer.document.getInnerComponents(CVModel2)[0];
  });

  afterEach(function(){
    process.off("unhandledRejection", onUnhandled);
  });

  describe("overlay maps", function(){
    /** Texture requests by file name. They ignore abort signals, like Three's loaders. */
    let textures: Map<string, Deferred<Texture>>;
    /** The overlays applied to the model's materials, in order. */
    let applied: string[];

    beforeEach(function(){
      textures = new Map();
      explorer.app.system.getMainComponent(CVAssetReader).getTexture = (path: string) => {
        const deferred = new Deferred<Texture>();
        textures.set(path, deferred);
        return deferred.promise;
      };

      [ "A.png", "B.png" ].forEach(uri => {
        const asset = model.activeDerivative.createAsset(EAssetType.Image, uri);
        asset.data.mapType = EMapType.Zone;
        model.getOverlay(uri).asset = asset;
      });
      model.ins.overlayMap.setOptions([ "None", "A.png", "B.png" ]);

      applied = [];
      const updateOverlayMaterial = (model as any).updateOverlayMaterial.bind(model);
      (model as any).updateOverlayMaterial = (texture: Texture, uri: string) => {
        applied.push(uri);
        updateOverlayMaterial(texture, uri);
      };
    });

    it("applies the overlay selected last, whatever order its texture arrives in", async function(){
      model.ins.overlayMap.setValue(1);
      explorer.update();
      model.ins.overlayMap.setValue(2);
      explorer.update();

      textures.get("B.png").resolve(new Texture());
      await explorer.settle();
      textures.get("A.png").resolve(new Texture());
      await explorer.settle();

      expect(applied).to.deep.equal([ "B.png" ]);
      expect(model.outs.overlayMap.value).to.equal(2);
    });

    it("keeps the current overlay when the selected one fails to load", async function(){
      const error = new Error("missing overlay");
      model.ins.overlayMap.setValue(1);
      explorer.update();
      textures.get("A.png").reject(error);
      await explorer.settle();

      expect(applied).to.deep.equal([]);
      expect(model.outs.overlayMap.value).to.equal(0);
      expect(unhandled).not.to.include(error);
    });
  });
});
