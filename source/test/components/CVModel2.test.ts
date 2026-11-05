import { expect } from "chai";
import { BufferGeometry, Group, Material, Mesh, MeshStandardMaterial, Texture } from "three";

import CVModel2 from "client/components/CVModel2";
import CVAssetReader from "client/components/CVAssetReader";
import { EAssetType, EDerivativeQuality, EMapType } from "client/schema/model";

import { createDocumentData, createExplorer, Deferred, IExplorer } from "../helpers/explorer";


describe("CVModel2", function(){
  let explorer: IExplorer;
  let model: CVModel2;
  let unhandled: any[];
  const onUnhandled = (reason: any) => unhandled.push(reason);

  beforeEach(function(){
    unhandled = [];
    process.on("unhandledRejection", onUnhandled);
    explorer = createExplorer();
  });

  afterEach(function(){
    process.off("unhandledRejection", onUnhandled);
  });

  /** Loads a document holding a single model, "a". */
  async function load() {
    explorer.responses.set("scene.svx.json", createDocumentData([ { name: "a" } ]));
    await explorer.app.loadDocument("scene.svx.json");
    await explorer.settle();
    model = explorer.document.getInnerComponents(CVModel2)[0];
  }

  describe("overlay maps", function(){
    /** Texture requests by file name. They ignore abort signals, like Three's loaders. */
    let textures: Map<string, Deferred<Texture>>;
    /** The overlays applied to the model's materials, in order. */
    let applied: string[];

    beforeEach(async function(){
      await load();
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

  describe("variants", function(){
    const white = 0xffffff, red = 0xff0000, blue = 0x0000ff, green = 0x00ff00;
    /** Material requests to the glTF parser, by material index */
    let materials: Map<number, Deferred<Material>>;
    /** Two meshes, each with a material per variant: red (0, 1), blue (2, 3), green (4, 5) */
    let meshes: Mesh[];

    beforeEach(async function(){
      materials = new Map();
      explorer.app.system.getMainComponent(CVAssetReader).getModel = () => {
        const group = new Group();
        meshes = [ 0, 1 ].map(index => {
          const mesh = new Mesh(new BufferGeometry(), new MeshStandardMaterial({ color: white }));
          mesh.userData.gltfExtensions = { KHR_materials_variants: { mappings: [ 0, 1, 2 ].map(variant =>
            ({ material: variant * 2 + index, variants: [ variant ] })) } };
          group.add(mesh);
          return mesh;
        });
        group.userData.variants = Object.assign([ { name: "red" }, { name: "blue" }, { name: "green" } ], { variantMaterials: {} });
        group.userData.parser = { getDependency: (type: string, index: number) => {
          const deferred = new Deferred<Material>();
          materials.set(index, deferred);
          return deferred.promise;
        } };
        return Promise.resolve(group);
      };
      await load();
      // loading the model selected its first variant
      materials.get(0).resolve(new MeshStandardMaterial({ color: red }));
      materials.get(1).resolve(new MeshStandardMaterial({ color: red }));
      await explorer.settle();
    });

    function select(variant: string) {
      model.ins.variant.setOption(variant);
      explorer.update();
    }
    const colors = () => meshes.map(mesh => (mesh.material as MeshStandardMaterial).color.getHex());

    it("switches to the variant selected last, whatever order materials arrive in", async function(){
      expect(colors()).to.deep.equal([ red, red ]);
      select("blue");
      select("green");
      [ 4, 5 ].forEach(index => materials.get(index).resolve(new MeshStandardMaterial({ color: green })));
      await explorer.settle();
      [ 2, 3 ].forEach(index => materials.get(index).resolve(new MeshStandardMaterial({ color: blue })));
      await explorer.settle();

      expect(colors()).to.deep.equal([ green, green ]);
      expect(model.outs.variant.value).to.equal(2);
    });

    it("switches all meshes or none", async function(){
      select("blue");
      materials.get(2).resolve(new MeshStandardMaterial({ color: blue }));
      await explorer.settle();
      expect(colors(), "while the other material loads").to.deep.equal([ red, red ]);

      const error = new Error("missing material");
      materials.get(3).reject(error);
      await explorer.settle();

      expect(colors()).to.deep.equal([ red, red ]);
      expect(model.outs.variant.value).to.equal(0);
      expect(unhandled).not.to.include(error);
    });
  });

  describe("derivatives", function(){
    it("doesn't request a derivative that failed to load again on its own", async function(){
      let requests = 0;
      const respond = explorer.app.system.getMainComponent(CVAssetReader).getModel;
      explorer.app.system.getMainComponent(CVAssetReader).getModel = (path, options) => (requests++, respond(path, options));
      explorer.responses.set("a-High.glb", new Error("offline"));
      await load();

      expect(requests).to.equal(1);
      expect(explorer.events.filter(event => event.type === "model-error")).to.have.length(1);
    });

    it("falls back to the high quality when the thumbnail fails to load", async function(){
      explorer.responses.set("scene.svx.json", createDocumentData([ { name: "a", qualities: [ "Thumb", "High" ] } ]));
      explorer.responses.set("a-Thumb.glb", new Error("offline"));
      await explorer.app.loadDocument("scene.svx.json");
      await explorer.settle();
      model = explorer.document.getInnerComponents(CVModel2)[0];

      expect(model.activeDerivative?.data.quality).to.equal(EDerivativeQuality.High);
    });

    it("loads a derivative again after it failed to load", async function(){
      explorer.responses.set("a-High.glb", new Error("offline"));
      await load();
      expect(model.isLoading()).to.be.false;
      expect(model.activeDerivative).to.be.null;

      explorer.responses.set("a-High.glb", "model");
      model.ins.quality.setValue(EDerivativeQuality.High);
      await explorer.settle();

      expect(model.activeDerivative).to.be.ok;
      expect(explorer.events.map(event => event.type)).to.include("model-load");
    });

    it("doesn't pick a quality after its document was swapped during the download", async function(){
      explorer.responses.set("a-High.glb", "deferred");
      explorer.responses.set("first.svx.json", createDocumentData([ { name: "a" } ]));
      explorer.responses.set("second.svx.json", createDocumentData([]));
      await explorer.app.loadDocument("first.svx.json");
      await explorer.settle();
      expect(explorer.pending.has("a-High.glb"), "still downloading").to.be.true;

      await explorer.app.loadDocument("second.svx.json");
      await explorer.settle();

      expect(unhandled).to.deep.equal([]);
    });

    it("fails a derivative with nothing to load", async function(){
      const data = createDocumentData([ { name: "a" } ]);
      data.models[0].derivatives[0].assets = [ { uri: "a.points", type: "Points" } ] as any;
      explorer.responses.set("scene.svx.json", data);
      await explorer.app.loadDocument("scene.svx.json");
      await explorer.settle();
      model = explorer.document.getInnerComponents(CVModel2)[0];

      expect(model.isLoading()).to.be.false;
      expect(model.isSettled).to.be.true;
      expect(explorer.events.map(event => event.type)).to.include("model-error");
    });
  });
});
