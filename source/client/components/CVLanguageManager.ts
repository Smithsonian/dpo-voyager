/**
 * 3D Foundation Project
 * Copyright 2020 Smithsonian Institution
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

    private _activeLanguages: ILanguageOption[] = [];
    private _translations: ITranslation = {};

    static readonly isSystemSingleton = true;

    protected static readonly ins = {
        enabled: types.Boolean("Language.Enabled", false),
        language: types.Enum("Interface.Language", ELanguageType, ELanguageType.EN),
    };

    protected static readonly outs = {
        language: types.Enum("Interface.Language", ELanguageType, ELanguageType.EN),
    };

    ins = this.addInputs(CVLanguageManager.ins);
    outs = this.addOutputs(CVLanguageManager.outs);

    /*get settingProperties() {
        return [
            this.ins.language
        ];
    }*/

    protected get assetReader() {
        return this.getMainComponent(CVAssetReader);
    }
    get activeLanguages() {
        return this._activeLanguages;
    }

    nameString()
    {
        return ELanguageStringType[ELanguageType[this.ins.language.value]];
    }

    codeString()
    {
        return ELanguageType[this.ins.language.value] as TLanguageType;
    }

    create()
    {
        super.create(); 
    }

    update()
    {
        const { ins, outs } = this;
        
        if(this.activeLanguages.length == 0) {
            this.addLanguage(outs.language.value);
            //return;
        }
        
        if (ins.language.changed && ins.language.value != outs.language.value) {
            const newLanguage = ins.language.value;
            this.assetReader.getSystemJSON("language/string.resources." + ELanguageType[this.ins.language.value].toLowerCase() + ".json").then( json => {
                this._translations = json;
                this.updateLanguage(newLanguage);
                
                //this.analytics.sendProperty("Menu.Language", outs.language.value);
            });          
        }

        return true;
    }

    fromData(data: ILanguage)
    {
        const { ins, outs } = this;
        data = data || {} as ILanguage;

        const language = ELanguageType[data.language || "EN"];

        if(language != outs.language.value && ins.language.value === outs.language.value) {
            ins.language.setValue(isFinite(language) ? language : ELanguageType.EN);
        }
    }

    toData(): ILanguage
    {
        const ins = this.ins;

        return {
            language: ELanguageType[ins.language.getValidatedValue()] as TLanguageType,
        };
    }

    addLanguage(language: ELanguageType) {
        const exists = this._activeLanguages.find(element => element.id === language)

        if(!exists) {
            this._activeLanguages.push({ id: language, name: ELanguageStringType[ELanguageType[language]] });
        }
    }

    getLocalizedString(text: string): string
    {
        const dictionary = this._translations;
        if(dictionary === undefined) {
            return text;
        }
        if(ENV_DEVELOPMENT && typeof dictionary[text] === "undefined" 
            && ELanguageType[this.ins.language.value] != DEFAULT_LANGUAGE 
            && this.ins.language.value == this.outs.language.value //Prevent showing this message if dictionary is loading
        ){
            console.groupCollapsed(`Missing translation string "${text}" for "${ELanguageType[this.ins.language.value]}`);
            console.trace();
            console.groupEnd();
        }
        return dictionary[text] || text;
    }

    protected updateLanguage = (language: ELanguageType) => 
    {
        const { ins, outs } = this;
        if(ins.language.value === language){
            outs.language.setValue(language);
            this.emit<ITagUpdateEvent>({ type: "tag-update" });
        }
    }
}