import { expect } from "chai";

import fetchOk from "client/utils/fetchOk";
import { HTTPError } from "client/utils/errors";


describe("fetchOk()", function(){
  const fetch = globalThis.fetch;
  /** What the stubbed fetch() resolves with, or rejects with if it's an error. */
  let answer: Response | Error;

  beforeEach(function(){
    globalThis.fetch = ((url: string, init: RequestInit = {}) => {
      if (init.signal?.aborted) {
        return Promise.reject(init.signal.reason);
      }
      return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer);
    }) as any;
  });

  afterEach(function(){
    globalThis.fetch = fetch;
  });

  async function rejection(promise: Promise<unknown>): Promise<any>
  {
    try {
      await promise;
    }
    catch (error) {
      return error;
    }
    throw new Error("expected the promise to reject");
  }

  it("resolves with successful responses", async function(){
    answer = new Response("hello");
    expect(await (await fetchOk("http://example.com/a")).text()).to.equal("hello");
  });

  it("rejects with an HTTPError carrying the server's plain text explanation", async function(){
    answer = new Response("disk full", { status: 507, statusText: "Insufficient Storage", headers: { "Content-Type": "text/plain; charset=utf-8" } });
    const error = await rejection(fetchOk("http://example.com/a"));

    expect(error).to.be.instanceOf(HTTPError);
    expect(error.status).to.equal(507);
    expect(error.detail).to.equal("disk full");
  });

  it("rejects with an HTTPError carrying the status text when the explanation isn't plain text", async function(){
    answer = new Response("<html>a whole page</html>", { status: 404, statusText: "Not Found", headers: { "Content-Type": "text/html" } });
    const error = await rejection(fetchOk("http://example.com/a"));

    expect(error).to.be.instanceOf(HTTPError);
    expect(error.status).to.equal(404);
    expect(error.detail).to.equal("Not Found");
  });

  it("rejects with a NetworkError when no answer arrives", async function(){
    answer = new TypeError("Failed to fetch");
    const error = await rejection(fetchOk("http://example.com/a"));

    expect(error).to.be.instanceOf(DOMException);
    expect(error.name).to.equal("NetworkError");
  });

  it("rejects with the signal's reason when aborted, whatever it is", async function(){
    const controller = new AbortController();
    const reason = new Error("cancelled");
    controller.abort(reason);

    expect(await rejection(fetchOk("http://example.com/a", { signal: controller.signal }))).to.equal(reason);
  });
});
