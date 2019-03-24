/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
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

import OrderedCollection from "@ff/core/OrderedCollection";
import UnorderedCollection from "@ff/core/UnorderedCollection";
import Component from "@ff/graph/Component";

import { IDocument, INode } from "common/types/document";
import { IInfo } from "common/types/info";

import Article from "../models/Article";

////////////////////////////////////////////////////////////////////////////////

export default class CVInfo extends Component
{
    static readonly typeName: string = "CVInfo";

    meta = new UnorderedCollection<any>();
    process = new UnorderedCollection<any>();
    articles = new OrderedCollection<Article>();
    leadArticle: Article = null;

    fromDocument(document: IDocument, node: INode)
    {
        if (!isFinite(node.info)) {
            throw new Error("info property missing in node");
        }

        const data = document.infos[node.info];

        if (data.meta) {
            this.meta.dictionary = data.meta;
        }
        if (data.process) {
            this.process.dictionary = data.process;
        }
        if (data.articles) {
            this.articles.items = data.articles.map(article => Article.fromJSON(article));
            if (data.leadArticle) {
                this.leadArticle = this.articles.getAt(data.leadArticle);
            }
        }
    }

    toDocument(document: IDocument, node: INode)
    {
        const data = {} as IInfo;

        if (this.meta.length > 0) {
            data.meta = this.meta.dictionary;
        }

        if (this.process.length > 0) {
            data.process = this.process.dictionary;
        }

        if (this.articles.length > 0) {
            const articles = this.articles.items;
            data.articles = articles.map(article => article.toJSON());
            if (this.leadArticle) {
                data.leadArticle = articles.indexOf(this.leadArticle);
            }
        }

        const index = document.infos.length;
        document.infos.push(data);
        node.info = index;
    }
}