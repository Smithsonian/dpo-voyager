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

import resolvePathname from "resolve-pathname";

import Node from "@ff/graph/Node";
import CTransform from "@ff/scene/components/CTransform";

import { IItem } from "common/types/item";
import CModel from "../components/CModel";

////////////////////////////////////////////////////////////////////////////////

export default class NItem extends Node
{
    static readonly type: string = "NItem";

    protected model: CModel;

    url: string;

    setUrl(url: string, assetPath?: string)
    {
        this.url = url;
        const urlPath = resolvePathname(".", url);
        this.model.setAssetPath(assetPath || urlPath);
    }

    createComponents()
    {
        this.createComponent(CTransform);
        this.model = this.createComponent(CModel);

        this.name = "Item";
    }

    fromData(itemData: IItem)
    {
        if (itemData.model) {
            this.model.fromData(itemData.model);
        }
    }

    toData(): IItem
    {
        const itemData: Partial<IItem> = {
            model: this.model.toData()
        };

        return itemData as IItem;
    }
}