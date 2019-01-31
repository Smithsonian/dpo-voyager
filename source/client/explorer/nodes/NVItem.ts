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

import CVItemData from "../components/CVItemData";
import CVModel from "../../core/components/CVModel";
import CVMeta from "../components/CVMeta";
import CVProcess from "../components/CVProcess";
import CVAnnotations from "../components/CVAnnotations";
import CVDocuments from "../components/CVDocuments";

////////////////////////////////////////////////////////////////////////////////

export default class NVItem extends NTransform
{
    get item() {
        return this.getComponent(CVItemData);
    }
    get meta() {
        return this.getComponent(CVMeta);
    }
    get process() {
        return this.getComponent(CVProcess);
    }
    get model() {
        return this.getComponent(CVModel);
    }
    get documents() {
        return this.getComponent(CVDocuments);
    }
    get annotations() {
        return this.getComponent(CVAnnotations);
    }

    createComponents()
    {
        super.createComponents();

        this.createComponent(CVItemData);
        this.createComponent(CVMeta);
        this.createComponent(CVProcess);
        this.createComponent(CVModel);
        this.createComponent(CVAnnotations);
        this.createComponent(CVDocuments);

        this.name = "Item";
    }
}