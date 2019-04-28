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

import DocumentView, { customElement, html } from "./DocumentView";
import CVDocument from "../../components/CVDocument";
import CVReader, { IArticleEntry } from "../../components/CVReader";
import Article from "../../models/Article";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-reader-view")
export default class ReaderView extends DocumentView
{
    protected reader: CVReader = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-reader-view");
    }

    protected renderMenuEntry(entry: IArticleEntry)
    {
        const article = entry.article;

        return html`<div class="sv-entry" @click=${e => this.onClickArticle(e, article.id)}>
            <h1>${article.data.title}</h1>
            <p>${article.data.lead}</p>
        </div>`;
    }

    protected render()
    {
        const reader = this.reader;
        if (!reader) {
            return html`<div class="ff-placeholder">No document selected.</div>`;
        }

        if (!reader.ins.enabled) {
            return html``;
        }

        if (!reader.activeArticle) {
            const articles = reader.articles;
            return html`<div class="sv-left"></div><div class="sv-article">
                <ff-icon class="sv-close-button" name="close" @click=${this.onClickClose}></ff-icon>
                ${articles.map(entry => this.renderMenuEntry(entry))}
            </div><div class="sv-right"></div>`;
        }

        return html`<div class="sv-left"></div><div class="sv-article">
                <ff-icon class="sv-close-button" name="close" @click=${this.onClickClose}></ff-icon>
                <div class="sv-container"></div>
            </div><div class="sv-right"></div>`;
    }

    protected onClickClose(event: MouseEvent)
    {
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent("close"));
    }

    protected onClickArticle(e: MouseEvent, articleId: string)
    {
        this.reader.ins.articleId.setValue(articleId);
    }

    protected updated(changedProperties): void
    {
        super.updated(changedProperties);

        const reader = this.reader;

        if (reader && reader.activeArticle) {
            const container = this.getElementsByClassName("sv-container").item(0) as HTMLElement;
            container.innerHTML = reader.outs.content.value;
        }
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.reader.outs.content.off("value", this.onUpdate, this);
            this.reader.outs.article.off("value", this.onUpdate, this);
            this.reader = null;
        }
        if (next) {
            this.reader = next.setup.reader;
            this.reader.outs.content.on("value", this.onUpdate, this);
            this.reader.outs.article.on("value", this.onUpdate, this);
        }
    }
}