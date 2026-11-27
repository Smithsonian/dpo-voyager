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

import Document, { IDocumentDisposeEvent, IDocumentUpdateEvent } from "@ff/core/Document";

import { IAnnotation } from "client/schema/model";
import AnnotationFactory from "client/annotations/AnnotationFactory";
import { ELanguageType, DEFAULT_LANGUAGE } from "client/schema/common";

////////////////////////////////////////////////////////////////////////////////

export type Vector3 = number[];

export type IAnnotationUpdateEvent = IDocumentUpdateEvent<Annotation>;
export type IAnnotationDisposeEvent = IDocumentDisposeEvent<Annotation>;

export default class Annotation extends Document<IAnnotation, IAnnotation>
{
    /** Values of the fields a document may leave out. Fields at their default aren't saved. */
    static readonly defaults = Object.freeze({
        visible: true,
        scale: 1,
        offset: 0,
        tilt: 0,
        azimuth: 0,
        color: Object.freeze([ 0, 0.61, 0.87 ]) as readonly number[],
        zoneIndex: -1,
    });

    // a getter: AnnotationFactory imports this module and isn't initialized yet when it loads
    static get defaultStyle() {
        return AnnotationFactory.defaultTypeName;
    }

    static get defaultColor() {
        return Annotation.defaults.color.slice();
    }

    private _language : ELanguageType = ELanguageType[DEFAULT_LANGUAGE];
    private _leadChanged : boolean = false;

    get title() {
        // TODO: Temporary - remove when single string properties are phased out
        if(Object.keys(this.data.titles).length === 0) {
            this.data.titles[ELanguageType[this.language]] = this.data.title;
        }

        return this.data.titles[ELanguageType[this.language]] || "Missing content";
    }

    set title(inTitle: string) {
        this.data.titles[ELanguageType[this.language]] = inTitle;
        this.update();
    }
    
    titleIn(language: ELanguageType){
        // TODO: Temporary - remove when single string properties are phased out
        if(Object.keys(this.data.titles).length === 0) {
            this.data.titles[ELanguageType[this.language]] = this.data.title;
        }
        return this.data.titles[language];
    }
    
    get lead() {
        // TODO: Temporary - remove when single string properties are phased out
        if(Object.keys(this.data.leads).length === 0) {
            this.data.leads[ELanguageType[this.language]] = this.data.lead;
        }

        const hasAltContent = Object.keys(this.data.leads).some(key => this.data.leads[key] && key !== ELanguageType[this.language]);

        return this.data.leads[ELanguageType[this.language]] || (hasAltContent ? "Missing content" : "");
    }
    set lead(inLead: string) {
        this.data.leads[ELanguageType[this.language]] = inLead;
        this.update();
    }
    get tags() {
        // TODO: Temporary - remove when single string properties are phased out
        if(Object.keys(this.data.taglist).length === 0) {
            if(this.data.tags.length > 0) {
                this.data.taglist[ELanguageType[this.language]] = this.data.tags;
            }
        }

        const hasAltContent = Object.keys(this.data.taglist).some(key => this.data.taglist[key].length > 0 && key !== ELanguageType[this.language]);

        return this.data.taglist[ELanguageType[this.language]] && this.data.taglist[ELanguageType[this.language]].length > 0 ? 
            this.data.taglist[ELanguageType[this.language]] : (hasAltContent ? ["Missing content"] : []);
    }
    set tags(inTags: string[]) {
        this.data.taglist[ELanguageType[this.language]] = inTags;
        this.update();
    }
    get language() {
        return this._language;
    }
    set language(newLanguage: ELanguageType) {
        this._language = newLanguage;
    }
    get imageCredit() {
        return this.data.imageCredit[ELanguageType[this.language]] || "";
    }
    set imageCredit(inCredit: string) {
        this.data.imageCredit[ELanguageType[this.language]] = inCredit;
        this.update();
    }
    get imageAltText() {
        return this.data.imageAltText[ELanguageType[this.language]] || "";
    }
    set imageAltText(inAlt: string) {
        this.data.imageAltText[ELanguageType[this.language]] = inAlt;
        this.update();
    }

    // Supports backwards compatibility for annotations pre-length limit
    get leadChanged() {
        return this._leadChanged;
    }
    set leadChanged(value: boolean) {
        this._leadChanged = value;
    }

    static fromJSON(json: IAnnotation)
    {
        return new Annotation(json);
    }

    protected init(): IAnnotation
    {
        return {
            id: Document.generateId(),
            title: "New Annotation",
            titles: {},
            lead: "",
            leads: {},
            marker: "",
            tags: [],
            taglist: {},
            articleId: "",
            imageUri: "",
            imageCredit: {},
            imageAltText: {},
            audioId: "",
            viewId: "",

            ...Annotation.defaults,
            style: Annotation.defaultStyle,
            expanded: false,

            position: null,
            direction: null,
            color: Annotation.defaultColor,
        };
    }

    protected deflate(data: IAnnotation, json: IAnnotation)
    {
        json.id = data.id;

        if (Object.keys(this.data.titles).length > 0) {
            json.titles = {};
            Object.keys(this.data.titles).forEach( key => {
                json.titles[key] = data.titles[key];
            })
        }
        else if (data.title) {
            json.title = data.title;
        }
        if (Object.keys(this.data.leads).length > 0) {
            json.leads = {};
            Object.keys(this.data.leads).forEach( key => {
                json.leads[key] = data.leads[key];
            })
        }
        else if (data.lead) {
            json.lead = data.lead;
        }
        if (data.marker) {
            json.marker = data.marker;
        }
        if (Object.keys(this.data.taglist).length > 0) {
            json.taglist = {};
            Object.keys(this.data.taglist).forEach( key => {
                json.taglist[key] = data.taglist[key].slice();
            })
        }
        else if (data.tags.length > 0) {
            json.tags = data.tags;
        }
        if (data.articleId) {
            json.articleId = data.articleId;
        }
        if (data.imageUri) {
            json.imageUri = data.imageUri;
        }
        if (Object.keys(this.data.imageCredit).length > 0) {
            json.imageCredit = {};
            Object.keys(this.data.imageCredit).forEach( key => {
                json.imageCredit[key] = data.imageCredit[key];
            })
        }
        if (Object.keys(this.data.imageAltText).length > 0) {
            json.imageAltText = {};
            Object.keys(this.data.imageAltText).forEach( key => {
                json.imageAltText[key] = data.imageAltText[key];
            })
        }
        if (data.audioId) {
            json.audioId = data.audioId;
        }
        if (data.viewId) {
            json.viewId = data.viewId;
        }
        const defaults = Annotation.defaults;

        if (data.style !== Annotation.defaultStyle) {
            json.style = data.style;
        }
        /*if (data.visible === false) {
            json.visible = data.visible;
        }*/
        if (data.position) {
            json.position = data.position.slice();
        }
        if (data.direction) {
            json.direction = data.direction.slice();
        }
        if (data.scale !== defaults.scale) {
            json.scale = data.scale;
        }
        if (data.offset !== defaults.offset) {
            json.offset = data.offset;
        }
        if (data.tilt !== defaults.tilt) {
            json.tilt = data.tilt;
        }
        if (data.azimuth !== defaults.azimuth) {
            json.azimuth = data.azimuth;
        }

        const color = data.color;
        if (color && color.some((value, i) => value !== defaults.color[i])) {
            json.color = color.slice();
        }

        if (data.zoneIndex > defaults.zoneIndex) {
            json.zoneIndex = data.zoneIndex;
        }

        return data as IAnnotation;
    }

    protected inflate(json: IAnnotation, data: IAnnotation)
    {
        data.id = json.id;

        data.title = json.title || "";
        data.titles = json.titles || {};
        data.lead = json.lead || "";
        data.leads = json.leads || {};
        data.marker = json.marker || "";
        data.tags = json.tags || [];
        data.taglist = json.taglist || {};

        data.articleId = json.articleId || "";
        data.imageUri = json.imageUri || "";
        data.imageCredit = json.imageCredit || {};
        data.imageAltText = json.imageAltText || {};
        data.audioId = json.audioId || "";
        data.viewId = json.viewId || "";

        const defaults = Annotation.defaults;

        data.style = json.style || Annotation.defaultStyle;
        data.visible = json.visible ?? defaults.visible;
        data.expanded = false;

        data.position = json.position.slice();
        data.direction = json.direction.slice();
        data.scale = json.scale ?? defaults.scale;
        data.offset = json.offset ?? defaults.offset;
        data.tilt = json.tilt ?? defaults.tilt;
        data.azimuth = json.azimuth ?? defaults.azimuth;

        data.color = json.color ?? Annotation.defaultColor;

        data.zoneIndex = json.zoneIndex ?? defaults.zoneIndex;
    }
}