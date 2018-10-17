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

import { TransformControls } from "../three/TransformControls";
import { IViewportPointerEvent, IViewportTriggerEvent } from "../app/Viewport";

import RenderContext, { IRenderable } from "../app/RenderContext";

import SelectionController, { ISelectComponentEvent } from "./SelectionController";

import Model from "./Model";
import Manip from "./Manip";

////////////////////////////////////////////////////////////////////////////////

export default class TransformManip extends Manip implements IRenderable
{
    static readonly type: string = "TransformManip";

    protected enabled: boolean = false;
    protected model: Model = null;
    protected manip = new TransformControls();
    protected scene: THREE.Scene = null;
    protected selectionController: SelectionController;

    create()
    {
        super.create();

        this.selectionController = this.getComponent(SelectionController, true);
        this.selectionController.on("select-component", this.onSelectComponent, this);
    }

    dispose()
    {
        this.selectionController.off("select-component", this.onSelectComponent, this);
        super.dispose();
    }

    render(context: RenderContext)
    {
        this.manip.camera = context.camera;
    }

    setEnabled(enabled: boolean)
    {
        this.enabled = enabled;
    }

    setScene(scene: THREE.Scene)
    {
        if (this.scene) {
            this.scene.remove(this.manip);
        }

        this.scene = scene;

        if (scene) {
            scene.add(this.manip);
        }
    }

    onPointer(event: IViewportPointerEvent)
    {
        if (this.enabled) {
            return this.manip.onPointer(event);
        }

        return super.onPointer(event);
    }

    onTrigger(event: IViewportTriggerEvent)
    {
        if (this.enabled) {
            return this.manip.onTrigger(event);
        }

        return super.onTrigger(event);
    }

    onSelectComponent(event: ISelectComponentEvent)
    {
        if (!event.component.is(Model)) {
            return;
        }

        const model = event.component as Model;
        if (!event.selected && model === this.model) {
            this.manip.detach();
            this.model = null;
            this.enabled = false;
        }
        else if (event.selected && !this.model) {
            this.manip.attach(model.object3D);
            this.model = model;
            this.enabled = true;
        }
    }
}