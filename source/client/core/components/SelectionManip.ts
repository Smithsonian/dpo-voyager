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

import Entity from "@ff/core/ecs/Entity";
import { ComponentTracker } from "@ff/core/ecs/Component";
import Hierarchy from "@ff/core/ecs/Hierarchy";

import RenderContext from "../system/RenderContext";

import Manip, { IManipPointerEvent, IManipTriggerEvent } from "./Manip";
import PickManip from "./PickManip";
import MainCamera from "./MainCamera";
import ManipTarget from "./ManipTarget";

////////////////////////////////////////////////////////////////////////////////

export default class SelectionManip extends Manip
{
    static readonly type: string = "SelectionManip";
    static readonly isSystemSingleton: boolean = true;

    protected pickManip: ComponentTracker<PickManip> = null;
    protected mainCam: ComponentTracker<MainCamera> = null;

    protected selectedEntities: Entity[] = [];
    protected isSelecting: boolean = false;

    protected manipWhileSelecting: boolean = true;
    protected allowMultiSelect: boolean = false;


    create(context: RenderContext)
    {
        super.create(context);

        this.pickManip = this.trackComponent(PickManip);
        this.mainCam = this.trackComponent(MainCamera);
    }

    onPointer(event: IManipPointerEvent)
    {
        if (!this.pickManip.component) {
            return super.onPointer(event);
        }

        if (event.isPrimary) {
            if (event.type === "down") {
                const rect = (event.originalEvent.currentTarget as HTMLElement).getBoundingClientRect();
                const x = event.centerX - rect.left;
                const y = event.centerY - rect.top;

                const pickResults = this.pickManip.component.pick(x, y);
                if (pickResults && pickResults.length > 0) {
                    const entity = pickResults[0].entity;

                    // is component already selected?
                    const index = this.selectedEntities.indexOf(entity);

                    if (this.allowMultiSelect && event.ctrlKey) {
                        // with control key: toggle selection
                        this.isSelecting = true;
                        if (index < 0) {
                            this.selectedEntities.push(entity);
                        }
                        else {
                            this.selectedEntities.splice(index, 1);
                        }
                    }
                    else if (index < 0) {
                        // without control key: replace selection
                        this.isSelecting = true;
                        this.selectedEntities.length = 0;
                        this.selectedEntities.push(entity);
                    }

                    this.selectedEntities.forEach(entity => console.log(entity.toString()));
                }
                else if (!this.allowMultiSelect || !event.ctrlKey) {
                    // without control key: clear selection
                    this.selectedEntities.length = 0;
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
        const selectedEntities = this.selectedEntities;
        for (let i = 0; i < selectedEntities.length; ++i) {
            let entity = selectedEntities[i];
            while(entity) {
                const components = entity.getComponents(ManipTarget);
                for (let j = 0; j < components.length; ++j) {
                    if (components[j].onTrigger(event)) {
                        return true;
                    }
                }

                const hierarchy = entity.getComponent(Hierarchy);
                entity = hierarchy ? hierarchy.parent && hierarchy.parent.entity : null;
            }
        }

        return super.onTrigger(event);
    }

    protected dispatchPointerEvent(event: IManipPointerEvent): boolean
    {
        const selectedEntities = this.selectedEntities;
        for (let i = 0; i < selectedEntities.length; ++i) {
            let entity = selectedEntities[i];
            while(entity) {
                const components = entity.getComponents(ManipTarget);
                for (let j = 0; j < components.length; ++j) {
                    if (components[j].onPointer(event)) {
                        return true;
                    }
                }

                const hierarchy = entity.getComponent(Hierarchy);
                entity = hierarchy ? hierarchy.parent && hierarchy.parent.entity : null;
            }
        }

        return super.onPointer(event);
    }
}