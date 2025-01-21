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

import { customElement, html, property } from "@ff/ui/CustomElement";

import List from "@ff/ui/List";
import MessageBox from "@ff/ui/MessageBox";
import { ILineEditChangeEvent } from "@ff/ui/LineEdit";

import Article from "../../models/Article";

import CVArticlesTask from "../../components/CVArticlesTask";
import { TaskView } from "../../components/CVTask";
import { ELanguageStringType, DEFAULT_LANGUAGE } from "client/schema/common";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-articles-task-view")
export default class ArticlesTaskView extends TaskView<CVArticlesTask>
{
    protected connected()
    {
        super.connected();
        this.task.outs.article.on("value", this.onArticleChange, this);
    }

    protected disconnected()
    {
        this.task.outs.article.off("value", this.onArticleChange, this);
        super.disconnected();
    }

    protected render()
    {
        if(!this.activeDocument) {
            return;
        }
        
        const task = this.task;
        const articles = task.articles;
        const activeArticle = task.activeArticle;
        const languageManager = this.activeDocument.setup.language;

        if (!articles) {
            return html`<div class="sv-placeholder">Please select a scene or model node to edit its articles.</div>`;
        }

        const detailView = activeArticle ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <sv-property-view .property=${languageManager.ins.language}></sv-property-view>
            <sv-property-view class="sv-property-block" .property=${task.ins.title}></sv-property-view>
            <sv-property-view class="sv-property-block" .property=${task.ins.tags}></sv-property-view>
            <div class="sv-label">Lead</div>
            <ff-text-edit name="lead" text=${task.ins.lead.value} @change=${this.onTextEdit}></ff-text-edit>
            <sv-property-view class="sv-property-block" disabled .property=${task.ins.uri}></sv-property-view>
        </div>` : null;

        const uri = activeArticle ? activeArticle.uri : null;

        // Trying article UI without edit button
        //<ff-button text="Edit" icon="pen" ?disabled=${!uri} @click=${this.onClickEdit}></ff-button>

        return html`<div class="sv-commands">
            <ff-button text="Create" icon="create" @click=${this.onClickCreate}></ff-button>
            <ff-button title="Move Article Up" icon="up" ?disabled=${!activeArticle} @click=${this.onClickUp}></ff-button>
            <ff-button title="Move Article Down" icon="down" ?disabled=${!activeArticle} @click=${this.onClickDown}></ff-button>          
            <ff-button text="Delete" icon="trash" ?disabled=${!activeArticle} @click=${this.onClickDelete}></ff-button>  
        </div>
        <div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-flex-row ff-group"><div class="sv-panel-header sv-task-item">${ELanguageStringType[DEFAULT_LANGUAGE]}</div><div class="sv-panel-header sv-task-item sv-item-border-l">${languageManager.nameString()}</div></div>
                <div class="ff-splitter-section" style="flex-basis: 30%">
                    <div class="ff-scroll-y ff-flex-column">
                        <sv-article-list .data=${articles.slice()} .selectedItem=${activeArticle} @select=${this.onSelectArticle} @edit=${this.onEditArticle}></sv-article-list>
                    </div>
                </div>
                <ff-splitter direction="vertical"></ff-splitter>
                <div class="ff-splitter-section" style="flex-basis: 70%">
                    ${detailView}
                </div>
            </div>
        </div>`
    }

    protected onClickCreate()
    {
        this.task.ins.create.set();
    }

    protected onClickEdit()
    {
        this.task.ins.edit.set();
    }

    protected onClickDelete()
    {
        MessageBox.show("Delete Article", "Are you sure?", "warning", "ok-cancel").then(result => {
            if (result.ok) {
                this.task.ins.delete.set();
            }
        });
    }

    protected onClickUp()
    {
        this.task.ins.moveArticleUp.set();
    }

    protected onClickDown()
    {
        this.task.ins.moveArticleDown.set();
    }

    protected onTextEdit(event: ILineEditChangeEvent)
    {
        const task = this.task;
        const target = event.target;
        const text = event.detail.text;

        if (target.name === "lead") {
            task.ins.lead.setValue(text);
        }
    }

    protected onSelectArticle(event: ISelectArticleEvent)
    {
        const article = event.detail.article;
        this.task.reader.ins.articleId.setValue(article ? article.id : "");
    }

    protected onEditArticle(event: IEditArticleEvent)
    {
        this.task.ins.edit.set();
    }

    protected onArticleChange()
    {
        this.onUpdate();
        //this.task.ins.edit.set();
    }
}

////////////////////////////////////////////////////////////////////////////////

export interface ISelectArticleEvent extends CustomEvent
{
    target: ArticleList;
    detail: {
        article: Article;
    }
}

export interface IEditArticleEvent extends CustomEvent
{
    target: ArticleList;
    detail: {
        article: Article;
    }
}

@customElement("sv-article-list")
export class ArticleList extends List<Article>
{
    @property({ attribute: false })
    selectedItem: Article = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-document-list");
    }

    protected renderItem(item: Article)
    {
        return html`<div class="ff-flex-row ff-group"><div class="sv-task-item">${item.defaultTitle}</div><div class="sv-task-item sv-item-border-l">${item.title}</div></div>`;
    }

    protected isItemSelected(item: Article)
    {
        return item === this.selectedItem;
    }

    protected onClickItem(event: MouseEvent, item: Article)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { article: item }
        }));
    }

    protected onDblClickItem(event: MouseEvent, item: Article, index: number)
    {
        this.dispatchEvent(new CustomEvent("edit", {
            detail: { article: item }
        }));
    }

    protected onClickEmpty(event: MouseEvent)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { article: null }
        }));
    }
}