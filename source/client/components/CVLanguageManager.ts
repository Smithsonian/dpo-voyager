/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Component, { types } from "@ff/graph/Component";
import { ILanguage, ILanguageOption } from "client/schema/setup";
import { ELanguageType, TLanguageType, ELanguageStringType, DEFAULT_LANGUAGE } from "client/schema/common";
import CVAssetReader from "./CVAssetReader";
import { ITagUpdateEvent } from "./CVModel2";
import { enumToArray } from "@ff/core/types";

////////////////////////////////////////////////////////////////////////////////

export interface ITranslation {
    [key: string]: string;
}


/**
 * Component that manages current language options and
 * facilitates the switching of languages.
 */
export default class CVLanguageManager extends Component
{
    static readonly typeName: string = "CVLanguageManager";

    static readonly text: string = "Language";
    static readonly icon: string = "";

    private _sceneSetupLanguage:TLanguageType; // Primary language of the scene
    private _sceneSetupTranslations: ITranslation = {}; // and its translations

    private _uiLanguageTranslations: ITranslation = {}; // Translations for ui language

    private _sceneLanguages: {[key in TLanguageType]?: ILanguageOption} = {}; // All available languages in the scene

    private _activeSeneLanguageTranslations: ITranslation = {};  // Translation in the active language

    static readonly isSystemSingleton = true;

    protected static readonly ins = {
        enabled: types.Boolean("Language.Enabled", false),
        uiLanguage: types.Enum("Interface.Language", ELanguageType, {
            preset: ELanguageType[DEFAULT_LANGUAGE],
            enum: ELanguageType,
            options: enumToArray(ELanguageStringType).map(key => ELanguageStringType[key])
        }),
        activeLanguage: types.Enum("Interface.Language", ELanguageType, {
            preset: ELanguageType[DEFAULT_LANGUAGE],
            enum: ELanguageType,
            options: enumToArray(ELanguageStringType).map(key => ELanguageStringType[key])
        }),
    };

    protected static readonly outs = {
        /* exception to default language: in absence of any dictionary, this is always EN */
        activeLanguage: types.Enum("Interface.Language", ELanguageType, ELanguageType.EN ),
        uiLanguage: types.Enum("Interface.Language", ELanguageType, ELanguageType.EN ),
    };

    ins = this.addInputs(CVLanguageManager.ins);
    outs = this.addOutputs(CVLanguageManager.outs);

    protected get assetReader() {
        return this.getMainComponent(CVAssetReader);
    }

    get sceneLanguages() {
        return Object.values(this._sceneLanguages);
    }

    get sceneSetupLanguage(){
        return this._sceneSetupLanguage;
    }
    /**
     * 
     * @returns Full text string of the currently selected language
     */
    nameString() :string
    {
        return ELanguageStringType[ELanguageType[this.ins.activeLanguage.value]];
    }

    codeString()
    {
        return ELanguageType[this.ins.activeLanguage.value] as TLanguageType;
    }

    create()
    {
        super.create(); 
    }

    update()
    {
        const { ins, outs } = this;
        
        if(this.sceneLanguages.length == 0 && ins.activeLanguage.value == outs.activeLanguage.value) {
            this.addLanguage(outs.activeLanguage.value);
            //return;
        }
        
        if (ins.activeLanguage.changed && ins.activeLanguage.value != outs.activeLanguage.value) {
            const newLanguage = ins.activeLanguage.value;
            console.log("New scene language :" , newLanguage)
            this.addLanguage(newLanguage);
            this.assetReader.getSystemJSON("language/string.resources." + ELanguageType[this.ins.activeLanguage.value].toLowerCase() + ".json").then( json => {
                this._activeSeneLanguageTranslations = json;
                this.updateLanguage(newLanguage);
                
                //this.analytics.sendProperty("Menu.Language", outs.language.value);
            });          
        }

        if (ins.uiLanguage.changed) {
            console.log("New ui language :" , ins.uiLanguage);
            this.assetReader.getSystemJSON("language/string.resources." + ELanguageType[this.ins.uiLanguage.value].toLowerCase() + ".json").then( json => {
                this._uiLanguageTranslations = json;
                console.log("Bloup: ", this.getUILocalizedString("Download"));
                this.updateUILanguage(ins.uiLanguage.value); //REALLY necessary ?
                //this.updateLanguage(newLanguage);
            });
        }

        return true;
    }

    fromData(data: ILanguage)
    {
        const { ins, outs } = this;
        data = data || {} as ILanguage;

        const language = ELanguageType[data.language || "EN"] ?? ELanguageType[DEFAULT_LANGUAGE];
        this._sceneSetupLanguage = data.language || DEFAULT_LANGUAGE;

        this.assetReader.getSystemJSON("language/string.resources." + this._sceneSetupLanguage.toLowerCase() + ".json").then(json => 
            {this._sceneSetupTranslations = json});
        
        this.assetReader.getSystemJSON("language/string.resources." + DEFAULT_LANGUAGE.toLowerCase() + ".json").then(json => 
            {this._uiLanguageTranslations = json});

        ins.activeLanguage.setValue(language);
        ins.uiLanguage.setValue(ELanguageType[DEFAULT_LANGUAGE]);
    }

    toData(): ILanguage
    {
        const ins = this.ins;

        return {
            language: ELanguageType[ins.activeLanguage.getValidatedValue()] as TLanguageType,
        };
    }

    addLanguage(language: ELanguageType) {
        this._sceneLanguages[ELanguageType[language]] ??= { id: language, name: ELanguageStringType[ELanguageType[language]] };
    }

    getLocalizedString(text: string): string
    {
        return  this.getLocalizedStringIn (text, this._activeSeneLanguageTranslations, ELanguageType[this.outs.uiLanguage.value]);
    }

    getUILocalizedString(text: string): string
    {   
        return this.getLocalizedStringIn(text, this._uiLanguageTranslations, ELanguageType[this.outs.uiLanguage.value]);
    }

    getSceneSetupLocalizedString(text: string): string
    {   
        return this.getLocalizedStringIn(text, this._sceneSetupTranslations, this.sceneSetupLanguage);
    }

    protected getLocalizedStringIn(text: string, dictionary :ITranslation = {}, languageString: string): string {
        
        if(dictionary === undefined) {
            return text;
        }
        
        if(ENV_DEVELOPMENT && typeof dictionary[text] === "undefined" 
            && ELanguageType[this.ins.activeLanguage.value] != DEFAULT_LANGUAGE 
            && this.ins.activeLanguage.value == this.outs.activeLanguage.value //Prevent showing this message if dictionary is loading
        ){
            console.groupCollapsed(`Missing translation string "${text}" for "${ELanguageStringType[languageString]}"`);
            console.trace();
            console.groupEnd();
        }
        return dictionary[text] || text;
    }

    protected updateLanguage = (language: ELanguageType) => 
    {
        const { ins, outs } = this;
        if(ins.activeLanguage.value === language){
            outs.activeLanguage.setValue(language);
            this.emit<ITagUpdateEvent>({ type: "tag-update" });
        }
    }

    protected updateUILanguage = (uiLanguage: ELanguageType) => 
    {
        const { ins, outs } = this;
        if(ins.uiLanguage.value === uiLanguage){
            outs.uiLanguage.setValue(uiLanguage);
        }
    }
}