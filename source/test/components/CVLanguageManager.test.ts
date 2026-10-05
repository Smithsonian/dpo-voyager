import { expect } from "chai";

import System from "@ff/graph/System";
import CVLanguageManager from "client/components/CVLanguageManager";
import { DEFAULT_LANGUAGE, ELanguageStringType, ELanguageType } from "client/schema/common";


describe("CVLanguageManager", function(){
  let languageManager :CVLanguageManager;

  beforeEach(function(){
    const system = new System();
    system.registry.add(CVLanguageManager);
    const node = system.graph.createNode("Test");
    languageManager = node.createComponent(CVLanguageManager);
  });

  it("defaults to DEFAULT_LANGUAGE", function(){
    expect(languageManager.ins.activeLanguage.value).to.equal(ELanguageType[DEFAULT_LANGUAGE]);
    expect(languageManager.codeString()).to.equal(DEFAULT_LANGUAGE);
  });

  describe("nameString()", function(){
    it("returns the default language's name", function(){
      expect(languageManager.nameString()).to.equal(ELanguageStringType[DEFAULT_LANGUAGE]);
    });

    it("returns the active language's name", function(){
      languageManager.ins.activeLanguage.setValue(ELanguageType.NL);
      expect(languageManager.nameString()).to.equal(ELanguageStringType.NL);
    });
  });

  describe("addLanguage()", function(){
    it("adds a language once", function(){
      languageManager.addLanguage(ELanguageType.FR);
      languageManager.addLanguage(ELanguageType.FR);
      expect(languageManager.sceneLanguages).to.deep.equal([
        { id: ELanguageType.FR, name: ELanguageStringType.FR },
      ]);
    });
  });

  it("serializes the active language", function(){
    languageManager.ins.activeLanguage.setValue(ELanguageType.DE);
    expect(languageManager.toData()).to.deep.equal({ language: "DE" });
  });

  it("returns untranslated strings as-is when no dictionary is loaded", function(){
    expect(languageManager.getLocalizedString("Hello")).to.equal("Hello");
  });
});
