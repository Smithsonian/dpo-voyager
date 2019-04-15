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

import { customElement, html } from "@ff/ui/CustomElement";

import CVArticlesTask from "../../components/CVArticlesTask";
import { TaskView } from "../../components/CVTask";

import "./ArticleList";
import { ISelectArticleEvent } from "./ArticleList";
import { ILineEditChangeEvent } from "@ff/ui/LineEdit";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-articles-task-view")
export default class ArticlesTaskView extends TaskView<CVArticlesTask>
{
    protected render()
    {
        const node = this.activeNode;
        const meta = node && node.meta;

        if (!meta) {
            return html`<div class="sv-placeholder">Please select a node to edit its articles</div>`;
        }

        const articleList = meta.articles.items;
        const article = this.task.activeArticle;

        const detailView = article ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <div class="sv-label">Title</div>
            <ff-line-edit name="title" text=${article.data.title} @change=${this.onTextEdit}></ff-line-edit>
            <div class="sv-label">Lead</div>
            <ff-text-edit name="lead" text=${article.data.lead} @change=${this.onTextEdit}></ff-text-edit>
        </div>` : null;

        return html`<div class="sv-commands">
            <ff-button text="Create" icon="create" @click=${this.onClickCreate}></ff-button>       
            <ff-button text="Delete" icon="trash" ?disabled=${!article} @click=${this.onClickDelete}></ff-button>  
        </div>
        <div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-splitter-section" style="flex-basis: 30%">
                    <div class="ff-scroll-y ff-flex-column">
                        <sv-article-list .data=${articleList} .selectedItem=${article} @select=${this.onSelectArticle}></sv-article-list>
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

    protected onClickDelete()
    {

    }

    protected onTextEdit(event: ILineEditChangeEvent)
    {

    }

    protected onSelectArticle(event: ISelectArticleEvent)
    {
        this.task.activeArticle = event.detail.article;
    }
}