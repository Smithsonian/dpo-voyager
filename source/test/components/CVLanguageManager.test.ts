
import TypeRegistry from "@ff/core/TypeRegistry";
import System from "@ff/graph/System";
import { expect } from "chai";
import CVLanguageManager from "client/components/CVLanguageManager";
import { DEFAULT_LANGUAGE, ELanguageStringType, ELanguageType } from "client/schema/common";

describe("CVLanguageManager", function() {
  let languageManager :CVLanguageManager;

  this.beforeEach(function(){
    const system = new System();
    system.registry.add(CVLanguageManager);

    const node = system.graph.createNode("Test");
    languageManager = node.createComponent(CVLanguageManager, "one");
  });

  it("creates a language manager", function(){
    expect(languageManager).to.be.instanceof(CVLanguageManager);
  });

  it("initially DEFAULT_LANGUAGE", function(){
    expect(languageManager.outs.language.value).to.equal(ELanguageType[DEFAULT_LANGUAGE]);
  });

  it.skip("will overwrite default language on document open", function(){
    languageManager.fromData({
      language: "DE",
    });
    expect(languageManager.ins.language.value).to.equal(ELanguageType["DE"]);
  });

  describe("nameString()", function(){
    it("get DEFAULT_LANGUAGE string", function(){
      expect(languageManager.nameString()).to.equal(ELanguageStringType.EN);
    });
    it("get another language string", function(){
      languageManager.ins.language.setValue(ELanguageType.NL);
      expect(languageManager.nameString()).to.equal(ELanguageStringType.NL);
    })
  })
});

