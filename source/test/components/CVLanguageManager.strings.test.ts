import { expect } from "chai";

import CVLanguageManager from "client/components/CVLanguageManager";
import { ELanguageType } from "client/schema/common";

import { createDocumentData, createExplorer, IExplorer } from "../helpers/explorer";


describe("CVLanguageManager in a document", function(){
  let explorer: IExplorer;
  let language: CVLanguageManager;
  let unhandled: any[];
  const onUnhandled = (reason: any) => unhandled.push(reason);

  beforeEach(async function(){
    unhandled = [];
    process.on("unhandledRejection", onUnhandled);
    explorer = createExplorer();
    explorer.responses.set("scene.svx.json", createDocumentData([]));
    await explorer.app.loadDocument("scene.svx.json");
    await explorer.settle();
    language = explorer.document.setup.language;
  });

  afterEach(function(){
    process.off("unhandledRejection", onUnhandled);
  });

  function select(id: ELanguageType) {
    language.ins.activeLanguage.setValue(id);
    explorer.update();
  }

  it("uses the strings of the language selected last, whatever order they arrive in", async function(){
    explorer.responses.set("string.resources.fr.json", "deferred");
    explorer.responses.set("string.resources.de.json", "deferred");
    select(ELanguageType.FR);
    const fr = explorer.pending.get("string.resources.fr.json");
    select(ELanguageType.DE);
    explorer.pending.get("string.resources.de.json").resolve(new Response(`{ "Hello": "Hallo" }`));
    await explorer.settle();
    fr.resolve(new Response(`{ "Hello": "Bonjour" }`));
    await explorer.settle();

    expect(language.outs.activeLanguage.value).to.equal(ELanguageType.DE);
    expect(language.getLocalizedString("Hello")).to.equal("Hallo");
  });

  it("keeps the current language when the strings of another can't be loaded", async function(){
    explorer.responses.set("string.resources.fr.json", new Error("offline"));
    select(ELanguageType.FR);
    await explorer.settle();

    expect(language.outs.activeLanguage.value).to.equal(ELanguageType.EN);
    expect(unhandled.filter(error => /string\.resources\.fr\.json/.test(error?.message))).to.be.empty;
  });
});
