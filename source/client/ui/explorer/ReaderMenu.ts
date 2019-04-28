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

import CustomElement, { customElement, property, html } from "@ff/ui/CustomElement";
import "@ff/ui/Button";

import { IArticleEntry } from "../../components/CVReader";

////////////////////////////////////////////////////////////////////////////////

export interface IReaderMenuSelectEvent extends CustomEvent
{
    detail: {
        id: string
    }
}

@customElement("sv-reader-menu")
export default class ReaderMenu extends CustomElement
{
    @property({ attribute: false })
    articles: IArticleEntry[];

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-document-overlay", "sv-reader-menu");
    }

    protected renderEntry(entry: IArticleEntry)
    {
        return html`<div class="sv-entry" @click=${e => this.onClick(e, entry.article.id)}>
            <h1>${entry.article.data.title}</h1>
            <p>${entry.article.data.lead}</p>
        </div>`;
    }

    protected render()
    {
        const articles = this.articles;

        if (articles.length === 0) {
            return html`<div class="sv-entry">
                <h1>No articles available.</h1>
            </div>`;
        }

        return html`<div class="ff-scroll-y">
            ${articles.map(article => this.renderEntry(article))}
        </div>`;
    }

    protected onClick(event: MouseEvent, id: string)
    {
        event.stopPropagation();

        this.dispatchEvent(new CustomEvent("select", {
            detail: { id }
        }));
    }
}