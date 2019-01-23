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

import NTransform from "@ff/scene/nodes/NTransform";

import { IItem } from "common/types/item";

import CModel from "../components/CModel";

////////////////////////////////////////////////////////////////////////////////

export default class NItem extends NTransform
{
    static readonly type: string = "NItem";

    get model() {
        return this.components.get(CModel);
    }

    setUrl(url: string, assetPath?: string)
    {
        this.model.setUrl(url, assetPath);

        const urlName = url.substr(resolvePathname(".", url).length);
        if (urlName) {
            this.name = urlName;
        }
    }

    createComponents()
    {
        super.createComponents();

        this.createComponent(CModel);

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
        return {
            model: this.model.toData()
        };
    }
}