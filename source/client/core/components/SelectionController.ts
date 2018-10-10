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

import Component, { ComponentTracker, Entity } from "@ff/core/ecs/Component";
import Hierarchy from "@ff/core/ecs/Hierarchy";

import RenderContext from "../system/RenderContext";

import ManipController, { IManipPointerEvent, IManipTriggerEvent } from "./ManipController";
import Picker from "./Picker";
import MainCamera from "./MainCamera";
import ManipTarget from "./ManipTarget";

////////////////////////////////////////////////////////////////////////////////

export default class SelectionController extends ManipController
{
    static readonly type: string = "SelectionController";
    static readonly isSystemSingleton: boolean = true;

    protected picker: ComponentTracker<Picker> = null;
    protected mainCam: ComponentTracker<MainCamera> = null;

    protected selectedComponents: Component[] = [];
    protected isSelecting: boolean = false;

    protected manipWhileSelecting: boolean = true;
    protected allowMultiSelect: boolean = false;


    create(context: RenderContext)
    {
        super.create(context);

        this.picker = this.trackComponent(Picker);
        this.mainCam = this.trackComponent(MainCamera);
    }

    onPointer(event: IManipPointerEvent)
    {
        if (!this.picker || !this.mainCam.component) {
            return super.onPointer(event);
        }

        const camera = this.mainCam.component.activeCamera;
        if (!camera) {
            return super.onPointer(event);
        }

        if (event.isPrimary) {
            if (event.type === "down") {
                const rect = (event.originalEvent.currentTarget as HTMLElement).getBoundingClientRect();
                const x = event.centerX - rect.left;
                const y = event.centerY - rect.top;

                const pickResults = this.picker.component.pick(x, y, camera);
                if (pickResults && pickResults.length > 0) {
                    const component = pickResults[0].component;

                    // is component already selected?
                    const index = this.selectedComponents.indexOf(component);

                    if (this.allowMultiSelect && event.ctrlKey) {
                        // with control key: toggle selection
                        this.isSelecting = true;
                        if (index < 0) {
                            this.selectedComponents.push(component);
                        }
                        else {
                            this.selectedComponents.splice(index, 1);
                        }
                    }
                    else if (index < 0) {
                        // without control key: replace selection
                        this.isSelecting = true;
                        this.selectedComponents.length = 0;
                        this.selectedComponents.push(component);
                    }

                    this.selectedComponents.forEach(component => console.log(component.toString()));
                }
                else if (!this.allowMultiSelect || !event.ctrlKey) {
                    // without control key: clear selection
                    this.selectedComponents.length = 0;
                }
            }
            else if (event.type === "up") {
                this.isSelecting = false;
            }
        }

        if (!this.isSelecting || this.manipWhileSelecting) {
            return this.dispatchPointerEvent(event);
        }

        return true;
    }

    onTrigger(event: IManipTriggerEvent)
    {
        const selComps = this.selectedComponents;
        for (let i = 0; i < selComps.length; ++i) {
            let comp = selComps[i];
            while(comp) {
                const targets = comp.getComponents(ManipTarget);
                for (let j = 0; j < targets.length; ++j) {
                    if (targets[j].onTrigger(event)) {
                        return true;
                    }
                }

                const hierarchy = comp.getComponent(Hierarchy);
                comp = hierarchy ? hierarchy.parent : null;
            }
        }

        return super.onTrigger(event);
    }

    protected dispatchPointerEvent(event: IManipPointerEvent): boolean
    {
        const selComps = this.selectedComponents;
        for (let i = 0; i < selComps.length; ++i) {
            let comp = selComps[i];
            while(comp) {
                const targets = comp.getComponents(ManipTarget);
                for (let j = 0; j < targets.length; ++j) {
                    if (targets[j].onPointer(event)) {
                        return true;
                    }
                }

                const hierarchy = comp.getComponent(Hierarchy);
                comp = hierarchy ? hierarchy.parent : null;
            }
        }

        return super.onPointer(event);
    }
}