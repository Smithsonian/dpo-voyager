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

import NItem from "../../explorer/nodes/NItem";
import CAnnotations from "../../explorer/components/CAnnotations";

import AnnotationsTaskView from "../ui/AnnotationsTaskView";
import CTask from "./CTask";

////////////////////////////////////////////////////////////////////////////////

export enum EAnnotationsTaskMode { Off, Move, Create }

const ins = {
    mode: types.Enum("Mode", EAnnotationsTaskMode, EAnnotationsTaskMode.Off)
};

export default class CAnnotationsTask extends CTask
{
    static readonly type: string = "CAnnotationsTask";

    static readonly text: string = "Annotations";
    static readonly icon: string = "comment";

    ins = this.addInputs<CTask, typeof ins>(ins);

    protected activeAnnotations: CAnnotations = null;

    createView()
    {
        return new AnnotationsTaskView(this);
    }

    create()
    {
        super.create();
        this.selection.selectedComponents.on(CAnnotations, this.onSelectAnnotations, this);
    }

    activate()
    {

    }

    deactivate()
    {

    }

    dispose()
    {
        this.selection.selectedComponents.off(CAnnotations, this.onSelectAnnotations, this);
        super.dispose();
    }

    protected setActiveItem(item: NItem)
    {
        if (item) {
            this.activeAnnotations = item.annotations;
            this.selection.selectComponent(this.activeAnnotations);
        }
        else {
            this.activeAnnotations = null;
        }
    }

    protected onSelectAnnotations(event: IComponentEvent<CAnnotations>)
    {
        if (event.add && event.component.node instanceof NItem) {
            this.manager.activeItem = event.component.node;
        }
    }
}