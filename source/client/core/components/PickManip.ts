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

import { Dictionary } from "@ff/core/types";
import { IPublisherEvent } from "@ff/core/Publisher";
import { ISystemComponentEvent } from "@ff/core/ecs/System";

import Object3D, { IObject3DObjectEvent } from "../components/Object3D";

import Manip, { IViewportPointerEvent, IViewportTriggerEvent } from "./Manip";
import { IViewportManip } from "../app/ViewportManager";

////////////////////////////////////////////////////////////////////////////////

export { IViewportPointerEvent, IViewportTriggerEvent };

const _vec2 = new THREE.Vector2();

export interface IPickResult
{
    component: Object3D;
    object: THREE.Object3D;
    point: THREE.Vector3;
    normal: THREE.Vector3;
}


export interface IPickManipPickEvent extends IPublisherEvent<PickManip>, IPickResult
{
    pointerEvent: IViewportPointerEvent;
}

export default class PickManip extends Manip implements IViewportManip
{
    static readonly type: string = "PickManip";
    static readonly isSystemSingleton: boolean = true;

    // transforms by their three.js object UUID
    protected objectComponents: Dictionary<Object3D> = {};
    protected raycaster: THREE.Raycaster = new THREE.Raycaster();
    protected root: THREE.Object3D;
    protected activePick: IPickResult = null;

    protected startX: number = 0;
    protected startY: number = 0;

    constructor(id?: string)
    {
        super(id);
        this.addEvents("down", "up", "pick");
    }

    create()
    {
        super.create();
        this.system.addComponentEventListener(Object3D, this.onObject3D, this);
    }

    dispose()
    {
        this.system.removeComponentEventListener(Object3D, this.onObject3D, this);
        super.dispose();
    }

    setRoot(root: THREE.Object3D)
    {
        this.root = root;
    }

    onPointer(event: IViewportPointerEvent)
    {
        const viewport = event.viewport;
        const camera = viewport ? viewport.camera : null;

        if (camera && event.isPrimary) {

            if (event.type === "down") {
                this.startX = event.centerX;
                this.startY = event.centerY;

                const pickResults = this.pick(event.deviceX, event.deviceY, camera);
                const pick = this.activePick = pickResults[0];
                this.emitPickEvent("down", event, pick);
            }
            else if (event.type === "up") {
                this.emitPickEvent("up", event, this.activePick);

                const dx = event.centerX - this.startX;
                const dy = event.centerY - this.startY;

                if (Math.abs(dx) + Math.abs(dy) < 3) {
                    this.emitPickEvent("pick", event, this.activePick);
                }

                this.activePick = null;
            }
        }

        return super.onPointer(event);
    }

    /**
     * Emits an event with pick results.
     * @param {string} name Name of the event, one of "down", "up", and "pick".
     * @param {IViewportPointerEvent} event
     * @param {IPickResult} pick
     */
    protected emitPickEvent(name: string, event: IViewportPointerEvent, pick: IPickResult)
    {
        this.emit<IPickManipPickEvent>(name, {
            pointerEvent: event,
            component: pick ? pick.component : null,
            object: pick ? pick.object : null,
            point: pick ? pick.point : null,
            normal: pick ? pick.normal : null
        });
    }

    /**
     * Performs a picking operation, searching for all components containing
     * Three.js Object3Ds intersected by the pick ray.
     * @param {number} deviceX X position in normalized device coordinates (NDC).
     * @param {number} deviceY Y position in normalized device coordinates (NDC).
     * @param {Camera} camera The camera used to render the pick view.
     * @returns {IPickResult[]} Array of pick results containing information about the intersected objects.
     */
    protected pick(deviceX: number, deviceY: number, camera: THREE.Camera): IPickResult[]
    {
        if (!this.root) {
            return [];
        }

        _vec2.set(deviceX, deviceY);
        this.raycaster.setFromCamera(_vec2, camera);
        const intersects = this.raycaster.intersectObject(this.root, true);

        if (intersects.length === 0) {
            return [];
        }

        const pickResults: IPickResult[] = [];

        intersects.forEach(intersect => {
            //console.log("Picker.pick - pos", intersect.point.toArray(), "dir", intersect.face.normal.toArray());

            let component = undefined;
            let object = intersect.object;

            while(object && (component = this.objectComponents[object.id]) === undefined) {
                object = object === this.root ? null : object.parent;
            }

            if (component) {
                pickResults.push({
                    component,
                    object: intersect.object,
                    point: intersect.point,
                    normal: intersect.face ? intersect.face.normal : new THREE.Vector3(0, 0, -1)
                });
            }
        });

        return pickResults;
    }

    /**
     * Called whenever an Object3D component is added or removed.
     * Subscribes to object change events of Object3D components.
     * @param {ISystemComponentEvent<Object3D>} event
     */
    protected onObject3D(event: ISystemComponentEvent<Object3D>)
    {
        const component = event.component;

        if (event.add) {
            component.on("object", this.onObject3DObject, this);
            if (component.object3D) {
                this.objectComponents[component.object3D.id] = component;
            }
        }
        else if (event.remove) {
            component.off("object", this.onObject3DObject, this);
            delete this.objectComponents[component.object3D.id];
        }
    }

    /**
     * Called whenever the Three.js Object3D of an Object3D component changes.
     * Maintains a dictionary of Object3D components as pickable targets.
     * @param {IObject3DObjectEvent} event
     */
    protected onObject3DObject(event: IObject3DObjectEvent)
    {
        if (event.current) {
            delete this.objectComponents[event.current.id];
        }
        if (event.next) {
            this.objectComponents[event.next.id] = event.sender;
        }
    }
}
