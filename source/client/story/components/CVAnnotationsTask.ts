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

import { types } from "@ff/graph/propertyTypes";
import { IComponentEvent } from "@ff/graph/Node";

import NVItem from "../../explorer/nodes/NVItem";
import CVAnnotations from "../../explorer/components/CVAnnotations";

import AnnotationsTaskView from "../ui/AnnotationsTaskView";
import CVTask from "./CVTask";

////////////////////////////////////////////////////////////////////////////////

export enum EAnnotationsTaskMode { Off, Move, Create }

const _inputs = {
    mode: types.Enum("Mode", EAnnotationsTaskMode, EAnnotationsTaskMode.Off),
};

export default class CVAnnotationsTask extends CVTask
{
    static readonly text: string = "Annotations";
    static readonly icon: string = "comment";

    ins = this.addInputs<CVTask, typeof _inputs>(_inputs);

    protected activeAnnotations: CVAnnotations = null;

    createView()
    {
        return new AnnotationsTaskView(this);
    }

    activate()
    {
        super.activate();
        this.selection.selectedComponents.on(CVAnnotations, this.onSelectAnnotations, this);
    }

    deactivate()
    {
        this.selection.selectedComponents.off(CVAnnotations, this.onSelectAnnotations, this);
        super.deactivate();
    }

    protected setActiveItem(item: NVItem)
    {
        if (item && item.hasComponent(CVAnnotations)) {
            this.activeAnnotations = item.getComponent(CVAnnotations);
            this.selection.selectComponent(this.activeAnnotations);
        }
        else {
            this.activeAnnotations = null;
        }
    }

    protected onSelectAnnotations(event: IComponentEvent<CVAnnotations>)
    {
        if (event.add && event.object.node instanceof NVItem) {
            this.presentations.activeItem = event.object.node;
        }
    }
}