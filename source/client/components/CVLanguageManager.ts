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
import { ELanguageType, TLanguageType, ELanguageStringType } from "client/schema/common";
import CVReader from "./CVReader";
import CVAnnotationView from "./CVAnnotationView";
import CVScene from "./CVScene";
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

    static readonly text: string = "LanguageManager";
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

    protected get reader() { 
        return this.getSystemComponent(CVReader, true);
    }
    protected get assetReader() {
        return this.getMainComponent(CVAssetReader);
    }
    protected get scene() {
        return this.getSystemComponent(CVScene);
    }
    get activeLanguages() {
        return this._activeLanguages;
    }

    toString()
    {
        return ELanguageStringType[ELanguageType[this.ins.language.value]];
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
            return;
        }

        if (ins.language.changed) {
            this.assetReader.getSystemJSON("language/string.resources." + ELanguageType[this.ins.language.value].toLowerCase() + ".json").then( json => {
                this._translations = json;
                this.updateLanguage();
 
                //this.analytics.sendProperty("Menu.Language", outs.language.value);
            });          
        }

        return true;
    }

    fromData(data: ILanguage)
    {
        data = data || {} as ILanguage;

        const language = ELanguageType[data.language || "EN"];
        this.ins.language.setValue(isFinite(language) ? language : ELanguageType.EN);

        this.updateLanguage();
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

        return dictionary[text] || text;
    }

    protected updateLanguage = () => 
    {
        const { ins, outs, reader, scene } = this;

        if(reader) {
            // update articles
            reader.articles.forEach( entry => {
                entry.article.language = ins.language.value;
            });

            // trigger reader active article update
            reader.ins.articleId.set();
        }

        if(scene) {
            // update annotations
            const annotationViews = scene.getGraphComponents(CVAnnotationView);
            annotationViews.forEach(view => {
                view.getAnnotations().forEach( annotation => {
                    annotation.language = ins.language.value;
                });
                view.ins.activeTags.set();
            });
        }

        outs.language.setValue(ins.language.value);
        this.emit<ITagUpdateEvent>({ type: "tag-update" });
    }
}