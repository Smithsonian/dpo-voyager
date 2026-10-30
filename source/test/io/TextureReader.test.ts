import { expect } from "chai";
import { LoadingManager, Texture } from "three";

import TextureReader from "client/io/TextureReader";


describe("TextureReader", function(){
  let reader: TextureReader;
  /** Completes the texture load in progress */
  let load: (texture: Texture) => void;
  /** Fails it, as an image element does */
  let fail: (event: Event) => void;

  beforeEach(function(){
    reader = new TextureReader(new LoadingManager());
    // there are no images to decode in Node
    (reader as any).textureLoader = { load: (url, onLoad, onProgress, onError) => { load = onLoad; fail = onError; } };
  });

  it("resolves with the loaded texture", async function(){
    const loading = reader.get("http://example.com/a.jpg", "a.jpg");
    const texture = new Texture();
    load(texture);

    expect(await loading).to.equal(texture);
  });

  it("tells which texture failed to load", async function(){
    const loading = reader.get("http://example.com/a.jpg", "a.jpg");
    fail(new Event("error"));

    let error: any;
    await loading.catch(e => error = e);
    expect(error.message).to.contain("http://example.com/a.jpg");
  });

  it("rejects with the signal's reason once aborted, and disposes of a texture arriving later", async function(){
    const controller = new AbortController();
    const reason = new DOMException("superseded", "AbortError");
    const loading = reader.get("http://example.com/a.jpg", "a.jpg", { signal: controller.signal });
    controller.abort(reason);

    let error: any;
    await loading.catch(e => error = e);
    expect(error).to.equal(reason);

    const texture = new Texture();
    let disposed = false;
    texture.addEventListener("dispose", () => disposed = true);
    load(texture);
    expect(disposed).to.be.true;
  });

  it("doesn't load at all when already aborted", async function(){
    const controller = new AbortController();
    controller.abort();
    load = null;

    let error: any;
    await reader.get("http://example.com/a.jpg", "a.jpg", { signal: controller.signal }).catch(e => error = e);
    expect(error.name).to.equal("AbortError");
    expect(load).to.be.null;
  });
});
