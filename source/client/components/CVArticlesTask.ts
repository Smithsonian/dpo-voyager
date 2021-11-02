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

import filenamify from "filenamify";

import { Node, types } from "@ff/graph/Component";

import MessageBox from "@ff/ui/MessageBox";

import Article from "../models/Article";

import NVNode from "../nodes/NVNode";
import CVDocument from "./CVDocument";
import CVReader from "./CVReader";
import CVMeta from "./CVMeta";
import CVTask from "./CVTask";

import ArticlesTaskView from "../ui/story/ArticlesTaskView";
import CVMediaManager from "./CVMediaManager";
import CVAssetWriter from "./CVAssetWriter";
import { ELanguageStringType, ELanguageType, DEFAULT_LANGUAGE } from "client/schema/common";
import CVStandaloneFileManager from "./CVStandaloneFileManager";
import CVAnnotationView from "./CVAnnotationView";

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
        language: types.Option("Task.Language", Object.keys(ELanguageStringType).map(key => ELanguageStringType[key]), ELanguageStringType[ELanguageType.EN]),
    };

    protected static readonly outs = {
        article: types.Object("Article", Article)
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

    activateTask()
    {
        this.startObserving();
        super.activateTask();
        this.synchLanguage();
    }

    deactivateTask()
    {
        this.reader.ins.articleId.setValue("");  
        this.mediaManager.open(null); // close any open article
        this.stopObserving();
        super.deactivateTask();

    }

    update(context)
    {
        const ins = this.ins;
        const outs = this.outs;
        const meta = this.meta;
        const activeArticle = this.activeArticle;
        const activeAsset = activeArticle ? this.mediaManager.getAssetByPath(activeArticle.uri) : null;

        if(!this.activeDocument) {
            return false;
        }
        const languageManager = this.activeDocument.setup.language;

        if(ins.language.changed) {   
            const newLanguage = ELanguageType[ELanguageType[ins.language.value]];

            languageManager.addLanguage(newLanguage);  // add in case this is a currently inactive language
            languageManager.ins.language.setValue(newLanguage);
        }

        if (meta && ins.create.changed) {
            const article = new Article();
            const defaultFolder = CVMediaManager.articleFolder;
            article.uri = `${defaultFolder}/new-article-${article.id}-${ELanguageType[DEFAULT_LANGUAGE]}.html`;

            const standaloneFiles = this.getGraphComponent(CVStandaloneFileManager, true);
            if(standaloneFiles) {
                standaloneFiles.addFile(article.uri);
            }

            meta.articles.append(article);
            this.reader.ins.articleId.setValue(article.id);
            languageManager.ins.language.setValue(ELanguageType[DEFAULT_LANGUAGE]);
        }

        if (activeArticle) {
            if (ins.edit.changed) {
                if (activeAsset) {
                    this.mediaManager.open(activeAsset);
                }
                else if (activeArticle.uri) {
                    this.createEditArticle(activeArticle);
                }
            }
            if (ins.delete.changed) {
                this.deleteArticle(activeArticle);
            }
            if (ins.title.changed) {
                activeArticle.title = ins.title.value;
                if (!activeAsset) {
                    const uri = this.getSafeArticlePath(ins.title.value + "-" + ELanguageType[ins.language.value]);
                    activeArticle.uri = uri;
                    ins.uri.setValue(uri, true);
                }
            }
            if (ins.uri.changed) {
                activeArticle.uri = ins.uri.value;
            }
            if (ins.lead.changed || ins.tags.changed) {
                activeArticle.lead = ins.lead.value;
                activeArticle.tags = ins.tags.value.split(",").map(tag => tag.trim()).filter(tag => !!tag);
            }
        }
        else {
            if (ins.edit.changed) {
                this.mediaManager.open(null);
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
        const asset = this.mediaManager.getAssetByPath(article.uri);
        if (asset) {
            this.mediaManager.delete(asset);
        }
        
        // check for article ids in annotations
        const views = this.system.getComponents(CVAnnotationView); 
        views.forEach(component => {
            component.getAnnotations().forEach(annotation => {
                if(annotation.data.articleId === article.id) {
                    annotation.set("articleId", "");
                    component.updateAnnotation(annotation);
                }
            });
        });
    }

    protected createEditArticle(article: Article)
    {
        const uri = article.uri;

        this.assetWriter.putText(`<h1>${article.title}</h1>`, uri)
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
            previous.setup.language.outs.language.off("value", this.onDocumentLanguageChange, this);
            this.reader.outs.article.off("value", this.onArticleChange, this);
            this.reader = null;
        }
        if (next) {
            this.reader = next.setup.reader;
            this.reader.outs.article.on("value", this.onArticleChange, this);
            next.setup.language.outs.language.on("value", this.onDocumentLanguageChange, this);
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
        let article = this.reader.activeArticle;

        if (meta && article && meta.articles.getById(article.id)) {
            article = meta.articles.getById(article.id);
            ins.title.setValue(article.title, true);
            ins.lead.setValue(article.lead, true);
            ins.tags.setValue(article.tags.join(", "), true);
            ins.uri.setValue(article.uri, true);
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

    protected onDocumentLanguageChange()
    {
        const article = this.activeArticle;
        const {ins} = this;

        this.onArticleChange();
        this.synchLanguage();

        // if we don't have a uri for this language, create one so that it is editable
        if(this.activeArticle.uri === undefined) {
            const defaultFolder = CVMediaManager.articleFolder;
            article.uri = `${defaultFolder}/new-article-${article.id}-${ELanguageType[ins.language.value]}.html`;
        }
    }

    // Make sure this task language matches document
    protected synchLanguage() {
        const {ins} = this;
        const languageManager = this.activeDocument.setup.language;

        if(ins.language.value !== languageManager.outs.language.value)
        {
            ins.language.setValue(languageManager.outs.language.value, true);
        }
    }
}