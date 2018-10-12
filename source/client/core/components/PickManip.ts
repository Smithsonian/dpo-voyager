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

import { Dictionary, Partial } from "@ff/core/types";
import Component, { ComponentTracker } from "@ff/core/ecs/Component";

import { IViewportChangeEvent } from "../three/Viewport";
import RenderContext from "../system/RenderContext";

import Manip, { IManipPointerEvent, IManipTriggerEvent } from "./Manip";
import Transform from "./Transform";
import Scene from "./Scene";
import MainCamera from "./MainCamera";
import { ISystemComponentEvent } from "@ff/core/ecs/System";

////////////////////////////////////////////////////////////////////////////////

export { IManipPointerEvent, IManipTriggerEvent };

const _pickPos = new THREE.Vector2();

export type PickableComponent = Component & Partial<IPickable>;

export interface IPickable
{
    onPointer: (event: IManipPointerEvent, pickInfo: IPickResult) => boolean;
    onTrigger: (event: IManipTriggerEvent, pickInfo: IPickResult) => boolean;
}

export interface IPickResult
{
    transform: Transform;
    object: THREE.Object3D;
    point: THREE.Vector3;
    normal: THREE.Vector3;
}

export default class PickManip extends Manip
{
    static readonly type: string = "PickManip";
    static readonly isSystemSingleton: boolean = true;

    // transforms by their three.js object UUID
    protected transforms: Dictionary<Transform> = {};
    protected raycaster: THREE.Raycaster = new THREE.Raycaster();

    protected scene: ComponentTracker<Scene>;
    protected mainCamera: ComponentTracker<MainCamera>;
    protected viewportWidth: number = 0;
    protected viewportHeight: number = 0;

    protected activePick: IPickResult = null;
    protected activeTarget: PickableComponent = null;

    create(context: RenderContext)
    {
        super.create(context);

        const transforms = this.getComponents(Transform, true);
        transforms.forEach(transform => this.transforms[transform.object3D.id] = transform);

        this.system.addComponentEventListener(Transform, this.onTransform, this);

        this.scene = this.trackComponent(Scene);
        this.mainCamera = this.trackComponent(MainCamera);

        const viewport = context.viewport;
        this.viewportWidth = viewport.width;
        this.viewportHeight = viewport.height;

        viewport.on("change", this.onViewportChange, this);
    }

    destroy(context: RenderContext)
    {
        this.system.removeComponentEventListener(Transform, this.onTransform, this);
        context.viewport.off("change", this.onViewportChange, this);
    }

    onPointer(event: IManipPointerEvent)
    {
        const activeTarget = this.activeTarget;
        const activePick = this.activePick;

        if (event.isPrimary) {
            if (event.type === "down") {
                const rect = (event.originalEvent.currentTarget as HTMLElement).getBoundingClientRect();
                const x = event.centerX - rect.left;
                const y = event.centerY - rect.top;

                const pickResults = this.pick(x, y);
                if (pickResults.length > 0) {
                    const activePick = this.activePick = pickResults[0];
                    const pickables = activePick.transform.getPickableComponents();
                    for (let i = 0, n = pickables.length; i < n; ++i) {
                        const pickable = pickables[i];
                        if (pickable.onPointer(event, activePick)) {
                            this.activeTarget = pickable;
                            return true;
                        }
                    }
                }

                return super.onPointer(event);
            }
            else if (event.type === "up") {
                this.activeTarget = null;
                this.activePick = null;
            }
        }

        if (activeTarget) {
            return activeTarget.onPointer(event, activePick);
        }

        if (activePick) {
            const pickables = activePick.transform.getPickableComponents();
            for (let i = 0, n = pickables.length; i < n; ++i) {
                pickables[i].onPointer(event, activePick);
            }
        }

        return super.onPointer(event);
    }

    onTrigger(event: IManipTriggerEvent)
    {
        const activeTarget = this.activeTarget;
        const activePick = this.activePick;

        if (activeTarget) {
            return activeTarget.onTrigger(event, activePick);
        }

        if (activePick) {
            const pickables = activePick.transform.getPickableComponents();
            for (let i = 0, n = pickables.length; i < n; ++i) {
                pickables[i].onTrigger(event, activePick);
            }
        }

        return super.onTrigger(event);
    }

    protected pick(x: number, y: number): IPickResult[]
    {
        const scene = this.scene.component && this.scene.component.scene;
        const camera = this.mainCamera.component && this.mainCamera.component.activeCamera;

        const pickResults: IPickResult[] = [];

        if (!scene || !camera) {
            return pickResults;
        }

        _pickPos.x = (x / this.viewportWidth) * 2 - 1;
        _pickPos.y = 1 - (y / this.viewportHeight) * 2;

        this.raycaster.setFromCamera(_pickPos, camera);
        const intersects = this.raycaster.intersectObject(scene, true);

        if (intersects.length === 0) {
            return pickResults;
        }

        intersects.forEach(intersect => {
            //console.log("Picker.pick - pos", intersect.point.toArray(), "dir", intersect.face.normal.toArray());

            let transform = undefined;
            let object = intersect.object;

            while(object && (transform = this.transforms[object.id]) === undefined) {
                object = object === scene ? null : object.parent;
            }

            if (transform) {
                pickResults.push({
                    transform,
                    object: intersect.object,
                    point: intersect.point,
                    normal: intersect.face.normal
                });
            }
        });

        return pickResults;
    }

    /**
     * Returns a text representation of this object.
     * @returns {string}
     */
    toString()
    {
        const count = Object.keys(this.transforms).length;
        return super.toString() + ` - pickable components: ${count}`;
    }

    protected onTransform(event: ISystemComponentEvent<Transform>)
    {
        const transform = event.component;

        if (event.add) {
            this.transforms[transform.object3D.id] = transform;
        }
        else if (event.remove) {
            delete this.transforms[transform.object3D.id];
        }
    }

    protected onViewportChange(event: IViewportChangeEvent)
    {
        this.viewportWidth = event.sender.width;
        this.viewportHeight = event.sender.height;
    }
}
