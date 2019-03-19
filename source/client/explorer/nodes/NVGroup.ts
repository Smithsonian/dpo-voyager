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

import { EUnitType, IGroupItem } from "common/types/document";

import NVItem from "./NVItem";

import CVMeta from "../components/CVMeta";
import CVArticles from "../components/CVArticles";

////////////////////////////////////////////////////////////////////////////////

export default class NVGroup extends NVItem
{
    static readonly typeName: string = "NVGroup";

    get meta() {
        return this.components.get(CVMeta);
    }
    get articles() {
        return this.components.get(CVArticles);
    }

    createComponents()
    {
        super.createComponents();

        this.createComponent(CVMeta);
        this.createComponent(CVArticles);
    }

    fromData(data: IGroupItem)
    {
        // base class serializes units
        super.fromData(data);

        if (data.meta) {
            this.meta.fromData(data.meta);
        }

        if (data.articles) {
            this.articles.fromData(data.articles);
        }
    }

    toData(): IGroupItem
    {
        // base class serializes units
        const data: IGroupItem = super.toData();

        const metaData = this.meta.toData();
        if (metaData) {
            data.meta = metaData;
        }

        const articleData = this.articles.toData();
        if (articleData) {
            data.articles = articleData;
        }

        return data;
    }
}