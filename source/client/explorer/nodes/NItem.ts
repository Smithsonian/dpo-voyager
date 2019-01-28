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

import NTransform from "@ff/scene/nodes/NTransform";

import CItemData from "../components/CItemData";
import CModel from "../../core/components/CModel";
import CMeta from "../components/CMeta";
import CProcess from "../components/CProcess";
import CAnnotations from "../components/CAnnotations";
import CDocuments from "../components/CDocuments";

////////////////////////////////////////////////////////////////////////////////

export default class NItem extends NTransform
{
    static readonly type: string = "NItem";

    get item() {
        return this.components.get(CItemData);
    }
    get meta() {
        return this.components.get(CMeta);
    }
    get process() {
        return this.components.get(CProcess);
    }
    get model() {
        return this.components.get(CModel);
    }
    get documents() {
        return this.components.get(CDocuments);
    }
    get annotations() {
        return this.components.get(CAnnotations);
    }

    createComponents()
    {
        super.createComponents();

        this.createComponent(CItemData);
        this.createComponent(CMeta);
        this.createComponent(CProcess);
        this.createComponent(CModel);
        this.createComponent(CAnnotations);
        this.createComponent(CDocuments);

        this.name = "Item";
    }
}