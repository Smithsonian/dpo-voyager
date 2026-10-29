import { expect } from "chai";

import CVReader from "client/components/CVReader";

import { createDocumentData, createExplorer, IExplorer } from "../helpers/explorer";


describe("CVReader", function(){
  let explorer: IExplorer;
  let reader: CVReader;

  beforeEach(async function(){
    explorer = createExplorer();
    const data = createDocumentData([]);
    data.metas = [{ articles: [
      { id: "a", uri: "a.html", titles: { EN: "A" } },
      { id: "b", uri: "b.html", titles: { EN: "B" } },
    ] }] as any;
    data.scenes[0].meta = 0;
    explorer.responses.set("scene.svx.json", data);
    explorer.responses.set("a.html", "deferred");
    explorer.responses.set("b.html", "deferred");
    await explorer.app.loadDocument("scene.svx.json");
    await explorer.settle();
    reader = explorer.document.setup.reader;
  });

  function open(id: string) {
    reader.ins.articleId.setValue(id);
    explorer.update();
  }

  it("shows the article opened last, whatever order articles arrive in", async function(){
    open("a");
    const a = explorer.pending.get("a.html");
    open("b");
    explorer.pending.get("b.html").resolve(new Response("B content"));
    await explorer.settle();
    a.resolve(new Response("A content"));
    await explorer.settle();

    expect(reader.outs.content.value).to.equal("B content");
  });

  it("shows nothing once the article is closed, even if it arrives later", async function(){
    open("a");
    const a = explorer.pending.get("a.html");
    open("");
    a.resolve(new Response("A content"));
    await explorer.settle();

    expect(reader.outs.content.value).to.equal("");
  });

  it("tells when the article can't be read", async function(){
    explorer.responses.set("a.html", new Error("offline"));
    open("a");
    await explorer.settle();

    expect(reader.outs.content.value).to.match(/not found at a\.html/);
  });
});
