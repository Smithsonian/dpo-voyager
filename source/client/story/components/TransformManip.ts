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

import { TransformControls } from "../../core/three/TransformControls";
import { IViewportPointerEvent, IViewportTriggerEvent } from "../../core/app/Viewport";
import RenderContext, { IRenderable } from "../../core/app/RenderContext";

import SelectionController, { ISelectComponentEvent } from "./SelectionController";
import Model from "../../core/components/Model";

import Manip from "../../core/components/Manip";

////////////////////////////////////////////////////////////////////////////////

export default class TransformManip extends Manip implements IRenderable
{
    static readonly type: string = "TransformManip";

    protected enabled: boolean = false;
    protected manip = new TransformControls();
    protected object: Object3D = null;
    protected scene: THREE.Scene = null;
    protected events: IViewportPointerEvent[][] = [];

    create()
    {
        super.create();

        const selectionController = this.system.getComponent(SelectionController);
        if (selectionController) {
            selectionController.on("component", this.onSelectComponent, this);
        }

        this.manip.camera = new THREE.PerspectiveCamera(50, 1, 0.001, 10000);
        this.manip.camera.position.set(0, 0, 50);
    }

    render(context: RenderContext)
    {
        const viewport = context.viewport;
        //this.manip.camera = viewport.camera;
        const queue = this.events[viewport.index];
        if (queue) {
            queue.forEach(event => this.manip.onPointer(event));
            queue.length = 0;
        }
    }

    dispose()
    {
        const selectionController = this.system.getComponent(SelectionController);
        if (selectionController) {
            selectionController.on("component", this.onSelectComponent, this);
        }

        super.dispose();
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
            const index = event.viewport.index;
            const queue = this.events[index] || (this.events[index] = []);
            queue.push(event);
            return true;
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

    setTarget(objectComponent: Object3D)
    {
        if (this.object) {
            this.object.object3D.matrixAutoUpdate = false;
            this.manip.detach();
            this.enabled = false;
        }

        this.object = objectComponent;

        if (objectComponent) {
            objectComponent.object3D.matrixAutoUpdate = true;
            this.manip.attach(objectComponent.object3D);
            this.enabled = true;
        }
    }

    protected onSelectComponent(event: ISelectComponentEvent)
    {
        if (event.component.is(Model)) {
            this.setTarget(event.selected ? event.component as Object3D : null);
        }
    }
}