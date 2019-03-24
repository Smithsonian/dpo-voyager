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

import { IComponentEvent } from "@ff/graph/Node";

import CVArticles, { Article } from "../../explorer/components/CVArticles";
import NVItem from "../../explorer/nodes/NVItem";

import ArticlesTaskView from "../ui/ArticlesTaskView";
import CVTask from "./CVTask";

////////////////////////////////////////////////////////////////////////////////

export default class CVArticlesTask extends CVTask
{
    static readonly typeName: string = "CVArticlesTask";

    static readonly text: string = "Articles";
    static readonly icon: string = "document";

    private _activeArticle: Article = null;

    get activeArticle() {
        return this._activeArticle;
    }
    set activeArticle(article: Article) {
        if (article !== this._activeArticle) {
            this._activeArticle = article;
            this.emit("update");
        }
    }

    createView()
    {
        return new ArticlesTaskView(this);
    }

    activateTask()
    {
        super.activateTask();
        this.selectionController.selectedComponents.on(CVArticles, this.onSelectArticles, this);
    }

    deactivateTask()
    {
        this.selectionController.selectedComponents.off(CVArticles, this.onSelectArticles, this);
        super.deactivateTask();
    }

    protected onActiveItem(previous: NVItem, next: NVItem)
    {
        if (next) {
            this.selectionController.selectComponent(next.articles);
        }
    }

    protected onSelectArticles(event: IComponentEvent<CVArticles>)
    {
        const node = event.object.node;

        if (event.add && node instanceof NVItem) {
            this.itemManager.activeItem = node;
        }
    }
}