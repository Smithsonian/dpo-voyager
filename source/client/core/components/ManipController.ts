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

import Component, { ComponentLink, Entity } from "@ff/core/ecs/Component";

import {
    IManipEventHandler,
    IManipPointerEvent,
    IManipTriggerEvent
} from "@ff/react/ManipTarget";

import RenderContext from "../system/RenderContext";

////////////////////////////////////////////////////////////////////////////////

export { IManipPointerEvent, IManipTriggerEvent };

export default class ManipController extends Component implements IManipEventHandler
{
    static readonly type: string = "ManipController";

    next: ComponentLink<ManipController> = null;


    create(context: RenderContext)
    {
        this.next = new ComponentLink(this, ManipController);
    }

    onPointer(event: IManipPointerEvent)
    {
        if (this.next.component) {
            return this.next.component.onPointer(event);
        }

        return false;
    }

    onTrigger(event: IManipTriggerEvent)
    {
        if (this.next.component) {
            return this.next.component.onTrigger(event);
        }

        return false;
    }
}