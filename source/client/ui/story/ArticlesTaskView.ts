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

import { customElement, html, property } from "@ff/ui/CustomElement";

import CVArticlesTask from "../../components/CVArticlesTask";
import { TaskView } from "../../components/CVTask";

import { ILineEditChangeEvent } from "@ff/ui/LineEdit";
import Article from "../../models/Article";
import List from "@ff/ui/List";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-articles-task-view")
export default class ArticlesTaskView extends TaskView<CVArticlesTask>
{
    protected selectedArticle: Article = null;

    protected render()
    {
        const node = this.activeNode;
        const meta = node && node.meta;

        if (!meta) {
            return html`<div class="sv-placeholder">Please select a node to edit its articles</div>`;
        }

        const articles = meta.articles.items;
        const article = this.selectedArticle;

        const detailView = article ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <div class="sv-label">Title</div>
            <ff-line-edit name="title" text=${article.data.title} @change=${this.onTextEdit}></ff-line-edit>
            <div class="sv-label">Lead</div>
            <ff-text-edit name="lead" text=${article.data.lead} @change=${this.onTextEdit}></ff-text-edit>
            <div class="sv-label">URI</div>
            <ff-line-edit name="uri" text=${article.data.uri} @change=${this.onTextEdit}></ff-line-edit>
        </div>` : null;

        return html`<div class="sv-commands">
            <ff-button text="Create" icon="create" @click=${this.onClickCreate}></ff-button>       
            <ff-button text="Edit" icon="pen" ?disabled=${!article} @click=${this.onClickEdit}></ff-button>       
            <ff-button text="Delete" icon="trash" ?disabled=${!article} @click=${this.onClickDelete}></ff-button>  
        </div>
        <div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-splitter-section" style="flex-basis: 30%">
                    <div class="ff-scroll-y ff-flex-column">
                        <sv-article-list .data=${articles} .selectedItem=${article} @select=${this.onSelectArticle}></sv-article-list>
                    </div>
                </div>
                <ff-splitter direction="vertical"></ff-splitter>
                <div class="sv-panel-section sv-dialog sv-scrollable">
                <div class="ff-splitter-section" style="flex-basis: 70%">
                    ${detailView}
                </div>
            </div>
        </div>`
    }

    protected onClickCreate()
    {

    }

    protected onClickEdit()
    {

    }

    protected onClickDelete()
    {

    }

    protected onTextEdit(event: ILineEditChangeEvent)
    {
        const article = this.selectedArticle;
        if (article) {
            const field = event.target.name;
            const text = event.target.text;

            if (field === "title") {
                article.set(field, text);
            }
        }
    }

    protected onSelectArticle(event: ISelectArticleEvent)
    {
        this.selectedArticle = event.detail.article;
        this.requestUpdate();
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
        return item.data.title;
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

    protected onClickEmpty(event: MouseEvent)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { article: null }
        }));
    }
}