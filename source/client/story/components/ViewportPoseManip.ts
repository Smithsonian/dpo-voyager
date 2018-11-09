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

import * as THREE from "three";

import Object3D from "../../core/components/Object3D";

import { IViewportPointerEvent, IViewportTriggerEvent } from "../../core/app/Viewport";
import RenderContext from "../../core/app/RenderContext";
import Model from "../../core/components/Model";

import SelectionController, { ISelectComponentEvent } from "./SelectionController";
import PoseEditController, { EPoseEditMode } from "./PoseEditController";

import Manip from "../../core/components/Manip";

////////////////////////////////////////////////////////////////////////////////

export default class ViewportPoseManip extends Manip
{
    static readonly type: string = "ViewportPoseManip";

    protected enabled: boolean = false;
    protected model: Model = null;

    protected selectionController: SelectionController = null;
    protected poseEditController: PoseEditController = null;

    create()
    {
        super.create();

        this.selectionController = this.system.getComponent(SelectionController);
        this.selectionController.on("component", this.onSelectComponent, this);

        this.poseEditController = this.system.getComponent(PoseEditController);
        this.poseEditController.on("mode", this.onEditMode, this);
    }

    dispose()
    {
        this.selectionController.off("component", this.onSelectComponent, this);
        this.poseEditController.off("mode", this.onEditMode, this);

        super.dispose();
    }

    setEnabled(enabled: boolean)
    {
        this.enabled = enabled;
    }

    onPointer(event: IViewportPointerEvent)
    {
        if (this.enabled) {

        }

        return super.onPointer(event);
    }

    onTrigger(event: IViewportTriggerEvent)
    {
        if (this.enabled) {
        }

        return super.onTrigger(event);
    }

    protected onEditMode(mode: EPoseEditMode)
    {
        if (mode === EPoseEditMode.Off) {
            this.enabled = false;
        }
        else {
            this.enabled = true;
        }
    }

    protected onSelectComponent(event: ISelectComponentEvent)
    {
        if (event.component.is(Model)) {
            this.model = event.selected ? event.component as Model : null;
        }
    }
}