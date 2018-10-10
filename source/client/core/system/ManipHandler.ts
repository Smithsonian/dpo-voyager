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

import { IManipEventHandler, IManipPointerEvent, IManipTriggerEvent } from "@ff/react/ManipTarget";

import RenderSystem from "./RenderSystem";

////////////////////////////////////////////////////////////////////////////////

export default class ManipHandler implements IManipEventHandler
{
    readonly system: RenderSystem;

    protected manip: IManipEventHandler;

    constructor(system: RenderSystem)
    {
        this.system = system;
    }

    setManip(manip: IManipEventHandler)
    {
        this.manip = manip;
    }

    onPointer(event: IManipPointerEvent)
    {
        if (this.manip) {
            return this.manip.onPointer(event);
        }

        return false;
    }

    onTrigger(event: IManipTriggerEvent)
    {
        if (this.manip) {
            return this.manip.onTrigger(event);
        }

        return false;
    }
}