/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import * as filenamify from "filenamify";

import { Node, types } from "@ff/graph/Component";

import MessageBox from "@ff/ui/MessageBox";
import Notification from "@ff/ui/Notification";

import Article from "../models/Article";

import NVNode from "../nodes/NVNode";
import CVDocument from "./CVDocument";
import CVReader from "./CVReader";
import CVMeta from "./CVMeta";
import CVTask from "./CVTask";

import ArticlesTaskView from "../ui/story/ArticlesTaskView";
import CVMediaManager from "./CVMediaManager";
import CVAssetWriter from "./CVAssetWriter";

////////////////////////////////////////////////////////////////////////////////

export default class CVArticlesTask extends CVTask
{
    static readonly typeName: string = "CVArticlesTask";

    static readonly text: string = "Articles";
    static readonly icon: string = "article";


    protected static readonly ins = {
        create: types.Event("Articles.Create"),
        edit: types.Event("Articles.Edit"),
        delete: types.Event("Articles.Delete"),
        title: types.String("Article.Title"),
        lead: types.String("Article.Lead"),
        tags: types.String("Article.Tags"),
        uri: types.String("Article.URI"),
    };

    protected static readonly outs = {
        article: types.Object("Article", Article),
    };

    ins = this.addInputs<CVTask, typeof CVArticlesTask.ins>(CVArticlesTask.ins);
    outs = this.addOutputs<CVTask, typeof CVArticlesTask.outs>(CVArticlesTask.outs);

    meta: CVMeta = null;
    reader: CVReader = null;

    get articles() {
        return this.meta && this.meta.articles.items;
    }
    get activeArticle() {
        return this.outs.article.value;
    }

    protected get mediaManager() {
        return this.getMainComponent(CVMediaManager);
    }
    protected get assetWriter() {
        return this.getMainComponent(CVAssetWriter);
    }

    constructor(node: Node, id: string)
    {
        super(node, id);

        const configuration = this.configuration;
        configuration.interfaceVisible = true;
        configuration.bracketsVisible = true;
    }

    update(context)
    {
        const ins = this.ins;
        const outs = this.outs;
        const meta = this.meta;
        const activeArticle = this.activeArticle;
        const activeAsset = activeArticle ? this.mediaManager.getAssetByPath(activeArticle.data.uri) : null;

        if (meta && ins.create.changed) {
            const article = new Article();
            const defaultFolder = CVMediaManager.articleFolder;
            article.data.uri = `${defaultFolder}/new-article-${article.id}.html`;
            meta.articles.append(article);
            this.reader.ins.articleId.setValue(article.id);
        }

        if (activeArticle) {
            if (ins.edit.changed) {
                if (activeAsset) {
                    this.mediaManager.open(activeAsset);
                }
                else if (activeArticle.data.uri) {
                    this.createEditArticle(activeArticle);
                }
            }
            if (ins.delete.changed) {
                this.deleteArticle(activeArticle);
            }
            if (ins.title.changed) {
                activeArticle.data.title = ins.title.value;
                if (!activeAsset) {
                    const uri = this.getSafeArticlePath(ins.title.value);
                    activeArticle.data.uri = uri;
                    ins.uri.setValue(uri, true);
                }
            }
            if (ins.uri.changed) {
                activeArticle.data.uri = ins.uri.value;
            }
            if (ins.lead.changed || ins.tags.changed) {
                activeArticle.data.lead = ins.lead.value;
                activeArticle.data.tags = ins.tags.value.split(",").map(tag => tag.trim()).filter(tag => !!tag);
            }
        }

        outs.article.set();

        return true;
    }

    createView()
    {
        return new ArticlesTaskView(this);
    }

    protected deleteArticle(article: Article)
    {
        this.meta.articles.removeItem(article);
        const asset = this.mediaManager.getAssetByPath(article.data.uri);
        if (asset) {
            this.mediaManager.delete(asset);
        }
    }

    protected createEditArticle(article: Article)
    {
        const uri = article.data.uri;

        this.assetWriter.putText(`<h1>${article.data.title}</h1>`, uri)
        .then(() => this.mediaManager.refresh())
        .then(() => {
            const asset = this.mediaManager.getAssetByPath(uri);
            if (asset) {
                this.mediaManager.open(asset);
            }
        })
        .catch(error => MessageBox.show("Error", `Failed to create article at '${uri}'`, "error"));
    }

    protected getSafeArticlePath(title: string)
    {
        if (!title) {
            return "";
        }

        const path = filenamify(title, { replacement: "-" }).replace(/\s/g, "-").toLowerCase();
        const defaultFolder = CVMediaManager.articleFolder;

        return defaultFolder + "/" + path + ".html";
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.reader.outs.article.off("value", this.onArticleChange, this);
            this.reader = null;
        }
        if (next) {
            this.reader = next.setup.reader;
            this.reader.outs.article.on("value", this.onArticleChange, this);
        }
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        if (previous) {
            this.meta = null;
        }
        if (next) {
            if (!next.meta) {
                next.createComponent(CVMeta);
            }

            this.meta = next.meta;
        }

        // update active article
        this.onArticleChange();
    }

    protected onArticleChange()
    {
        const ins = this.ins;
        const outs = this.outs;
        const meta = this.meta;
        const article = this.reader.activeArticle;

        if (meta && article && meta.articles.getById(article.id)) {
            ins.title.setValue(article.data.title, true);
            ins.lead.setValue(article.data.lead, true);
            ins.tags.setValue(article.data.tags.join(", "), true);
            ins.uri.setValue(article.data.uri, true);
            outs.article.setValue(article);
        }
        else {
            ins.title.setValue("", true);
            ins.lead.setValue("", true);
            ins.tags.setValue("", true);
            ins.uri.setValue("", true);
            outs.article.setValue(null);
        }


    }
}