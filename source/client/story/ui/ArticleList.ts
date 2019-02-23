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

import { customElement, property } from "@ff/ui/CustomElement";
import List from "@ff/ui/List";

import Article from "../../explorer/models/Article";

////////////////////////////////////////////////////////////////////////////////

export interface ISelectArticleEvent extends CustomEvent
{
    target: ArticleList;
    detail: {
        article: Article;
    }
}

@customElement("sv-article-list")
export default class ArticleList extends List<Article>
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
        return item.title;
    }

    protected isItemSelected(item: Article)
    {
        return item === this.selectedItem;
    }

    protected onClickItem(event: MouseEvent, item: Article)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { document: item }
        }));
    }

    protected onClickEmpty(event: MouseEvent)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { document: null }
        }));
    }
}