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

import Component, { types } from "@ff/graph/Component";

import { IAnnotations } from "common/types/scene";

import CVAnnotationView from "./CVAnnotationView";

////////////////////////////////////////////////////////////////////////////////

export default class CVAnnotations extends Component
{
    static readonly typeName: string = "CVAnnotations";

    protected static readonly ins = {
        visible: types.Boolean("Annotations.Visible", false),
    };

    ins = this.addInputs(CVAnnotations.ins);


    update(context)
    {
        const ins = this.ins;

        if (ins.visible.changed) {
            const visible = ins.visible.value;
            this.getGraphComponents(CVAnnotationView).forEach(view => view.ins.visible.setValue(visible));
        }

        return true;
    }

    fromData(data: IAnnotations)
    {
        this.ins.setValues({
            visible: data.visible || false,
        });
    }

    toData(): IAnnotations
    {
        return {
            visible: this.ins.visible.value,
        };
    }
}