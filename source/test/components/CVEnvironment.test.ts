import { expect } from "chai";
import { Texture } from "three";

import CVEnvironment from "client/components/CVEnvironment";

import { createDocumentData, createExplorer, IExplorer } from "../helpers/explorer";


describe("CVEnvironment", function(){
  let explorer: IExplorer;
  let environment: CVEnvironment;
  /** Map names, by index */
  let maps: string[];
  /** How many times each map was requested */
  let requests: Map<string, number>;

  beforeEach(async function(){
    explorer = createExplorer();
    explorer.responses.set("scene.svx.json", createDocumentData([]));
    await explorer.app.loadDocument("scene.svx.json");
    await explorer.settle();

    environment = explorer.document.setup.environment;
    // back from the helper's stub, with a stand-in for the WebGL map generator
    delete (environment as any).loadEnvironmentMap;
    (environment as any)._pmremGenerator = { fromEquirectangular: (texture: Texture) => ({ texture, dispose() {} }) };
    maps = (environment as any)._imageOptions;

    requests = new Map();
    const respond = explorer.app.system.getMainComponent<any>("CVAssetReader").getSystemTexture;
    explorer.app.system.getMainComponent<any>("CVAssetReader").getSystemTexture = (path: string, options) => {
      const name = path.split("/").pop();
      requests.set(name, (requests.get(name) ?? 0) + 1);
      return respond(path, options);
    };
  });

  function select(index: number) {
    environment.ins.imageIndex.setValue(index);
    explorer.update();
  }

  it("shows the map selected last, whatever order maps arrive in", async function(){
    explorer.responses.set(maps[1], "deferred");
    explorer.responses.set(maps[2], "deferred");
    environment.ins.visible.setValue(true);
    select(1);
    const first = explorer.pending.get(maps[1]);
    select(2);
    const second = new Texture();
    explorer.pending.get(maps[2]).resolve(second);
    await explorer.settle();
    first.resolve(new Texture());
    await explorer.settle();

    // @ts-ignore: sceneNode is protected, the scene is what these tests observe
    expect(environment.sceneNode.scene.background).to.equal(second);
  });

  it("requests a map again after it failed to load", async function(){
    explorer.responses.set(maps[1], new Error("offline"));
    environment.ins.visible.setValue(true);
    select(1);
    await explorer.settle();
    // @ts-ignore: sceneNode is protected, the scene is what these tests observe
    expect(environment.sceneNode.scene.background).to.be.null;

    explorer.responses.set(maps[1], "texture");
    environment.ins.visible.setValue(false);
    explorer.update();
    environment.ins.visible.setValue(true);
    await explorer.settle();

    expect(requests.get(maps[1])).to.equal(2);
    // @ts-ignore: sceneNode is protected, the scene is what these tests observe
    expect(environment.sceneNode.scene.background).to.be.instanceOf(Texture);
  });
});
