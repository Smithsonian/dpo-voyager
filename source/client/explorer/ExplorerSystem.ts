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

import Commander from "@ff/core/Commander";
import Registry from "@ff/graph/Registry";
import { IRenderContext } from "@ff/scene/RenderSystem";
import SelectionController, { INodeEvent, IComponentEvent } from "@ff/scene/SelectionController";

import VoyagerSystem from "../core/VoyagerSystem";
import InterfaceController from "./controllers/InterfaceController";

////////////////////////////////////////////////////////////////////////////////

export { INodeEvent, IComponentEvent };

export default class ExplorerSystem extends VoyagerSystem
{
    readonly selectionController: SelectionController;
    readonly interfaceController: InterfaceController;

    constructor(commander: Commander, registry?: Registry)
    {
        super(commander, registry);

        this.selectionController = new SelectionController(this, commander);
        this.interfaceController = new InterfaceController(this, commander);
    }

    onAfterRender(renderer, scene, camera)
    {
        this.selectionController.render(renderer, scene, camera);
    }
}