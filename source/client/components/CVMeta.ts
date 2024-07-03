/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import OrderedCollection, { ICollectionUpdateEvent } from "@ff/core/OrderedCollection";
import UnorderedCollection from "@ff/core/UnorderedCollection";
import Component from "@ff/graph/Component";

import { IDocument, INode, IScene } from "client/schema/document";
import { IMeta, IImage, INote, IAudioClip } from "client/schema/meta";

import Article from "../models/Article";
import { ELanguageType } from "client/schema/common";
import CVLanguageManager from "./CVLanguageManager";

////////////////////////////////////////////////////////////////////////////////

export type IArticlesUpdateEvent = ICollectionUpdateEvent<Article>;

export default class CVMeta extends Component
{
    static readonly typeName: string = "CVMeta";

    static readonly text: string = "Meta";
    static readonly icon: string = "document";

    collection = new UnorderedCollection<any>();
    process = new UnorderedCollection<any>();
    images = new UnorderedCollection<IImage>();
    articles = new OrderedCollection<Article>();
    leadArticle: Article = null;
    notes: INote[] = [];
    audio = new UnorderedCollection<IAudioClip>();

    protected get language() {
        return this.getGraphComponent(CVLanguageManager, true);
    }

    fromDocument(document: IDocument, node: INode | IScene): number
    {
        if (!isFinite(node.meta)) {
            throw new Error("info property missing in node");
        }

        const data = document.metas[node.meta];

        if (data.collection) {
            this.collection.dictionary = data.collection;
            if(this.collection.get("titles")) {
                Object.keys(this.collection.get("titles")).forEach( key => {
                    this.language.addLanguage(ELanguageType[key]);
                });
            }
        }
        if (data.process) {
            this.process.dictionary = data.process;
        }
        if (data.images) {
            const imageDict = {};
            data.images.forEach(image => imageDict[image.quality] = image);
            this.images.dictionary = imageDict;
        }
        if (data.articles) {
            this.articles.items = data.articles.map(article => Article.fromJSON(article));
            if (data.leadArticle !== undefined) {
                this.leadArticle = this.articles.getAt(data.leadArticle);
            }

            this.articles.items.forEach( article => {
                Object.keys(article.data.titles).forEach( key => {
                   this.language.addLanguage(ELanguageType[key]);
                });
            });
        }
        if (data.audio) {
            const audioDict = {};
            data.audio.forEach(clip => {
                clip.captionUris = clip.captionUris || {};
                clip.durations = {};
                audioDict[clip.id] = clip;
            });
            this.audio.dictionary = audioDict;
        }

        this.emit("load");
        return node.meta;
    }

    toDocument(document: IDocument, node: INode | IScene): number
    {
        let data: IMeta = null;

        if (this.collection.length > 0) {
            data = {
                collection: this.collection.dictionary,
            };
        }
        if (this.process.length > 0) {
            data = data || {};
            data.process = this.process.dictionary;
        }
        if (this.images.length > 0) {
            data = data || {};
            data.images = this.images.items;
        }
        if (this.articles.length > 0) {
            data = data || {};
            const articles = this.articles.items;
            data.articles = articles.map(article => article.toJSON());
            if (this.leadArticle) {
                data.leadArticle = articles.indexOf(this.leadArticle);
            }
        }
        if (this.audio.length > 0) {
            data = data || {};
            data.audio = this.audio.items;
            data.audio.forEach(clip => {
                clip.durations = {}; // don't save durations
            });
        }

        if (data) {
            document.metas = document.metas || [];
            const metaIndex = document.metas.length;
            document.metas.push(data);
            return metaIndex;
        }
    }
}