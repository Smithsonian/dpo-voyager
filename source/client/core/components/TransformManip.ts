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

import Object3D from "../components/Object3D";

import { TransformControls } from "../three/TransformControls";
import { IViewportPointerEvent, IViewportTriggerEvent } from "../app/Viewport";

import Manip from "./Manip";
import RenderContext, { IRenderable } from "../app/RenderContext";

////////////////////////////////////////////////////////////////////////////////

export default class TransformManip extends Manip implements IRenderable
{
    static readonly type: string = "TransformManip";

    protected enabled: boolean = false;
    protected manip = new TransformControls();
    protected object: Object3D = null;
    protected scene: THREE.Scene = null;

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

    setTarget(objectComponent: Object3D)
    {
        if (this.object) {
            this.manip.detach();
            this.enabled = false;
        }

        this.object = objectComponent;

        if (objectComponent) {
            this.manip.attach(objectComponent.object3D);
            this.enabled = true;
        }
    }
}