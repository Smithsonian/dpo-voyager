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
import { ISystemComponentEvent } from "@ff/core/ecs/System";
import Component, { ComponentTracker } from "@ff/core/ecs/Component";

import { IViewportChangeEvent } from "../three/Viewport";
import RenderContext from "../system/RenderContext";

import Transform from "./Transform";
import Scene from "./Scene";

////////////////////////////////////////////////////////////////////////////////

const _pickPos = new THREE.Vector2();

export interface IPickResult
{
    component: Component;
    object: THREE.Object3D;
    point: THREE.Vector3;
    normal: THREE.Vector3;
}

export default class Picker extends Component
{
    static readonly type: string = "Picker";
    static readonly isSystemSingleton: boolean = true;

    // transform components by three.js object UUID
    protected pickables: Dictionary<Component> = {};
    protected scene: ComponentTracker<Scene>;
    protected raycaster: THREE.Raycaster = new THREE.Raycaster();
    protected viewportWidth: number = 0;
    protected viewportHeight: number = 0;

    create(context: RenderContext)
    {
        this.scene = this.trackComponent(Scene);

        // add all transforms in system as pickables
        const transforms = this.system.getComponents(Transform);
        transforms.forEach(transform => { this.pickables[transform.object3D.id] = transform });

        this.system.addComponentEventListener(Transform, this.onTransformComponent, this);

        const viewport = context.viewport;
        this.viewportWidth = viewport.width;
        this.viewportHeight = viewport.height;

        viewport.on("change", this.onViewportChange, this);
    }

    destroy(context: RenderContext)
    {
        context.viewport.off("change", this.onViewportChange, this);
        this.system.removeComponentEventListener(Transform, this.onTransformComponent, this);
    }

    pick(x: number, y: number, camera: THREE.Camera): IPickResult[] | null
    {
        if (!this.scene.component) {
            return null;
        }

        const rootObject = this.scene.component.scene;

        _pickPos.x = (x / this.viewportWidth) * 2 - 1;
        _pickPos.y = 1 - (y / this.viewportHeight) * 2;

        this.raycaster.setFromCamera(_pickPos, camera);
        const intersects = this.raycaster.intersectObject(rootObject, true);

        if (intersects.length === 0) {
            return null;
        }

        const pickResults: IPickResult[] = [];

        intersects.forEach(intersect => {
            let component = undefined;
            let object = intersect.object;

            while(object && (component = this.pickables[object.id]) === undefined) {
                object = object === rootObject ? null : object.parent;
            }

            if (component) {
                pickResults.push({
                    component,
                    object,
                    point: intersect.point,
                    normal: intersect.face.normal
                });
            }
        });

        return pickResults;
    }

    /**
     * Returns the number of pickable components.
     * @returns {number}
     */
    count()
    {
        if (!this.pickables) {
            return 0;
        }

        return Object.keys(this.pickables).filter(component => component !== undefined).length;
    }

    /**
     * Returns a text representation of this object.
     * @returns {string}
     */
    toString()
    {
        return super.toString() + ` - pickable components: ${this.count()}`;
    }

    protected onViewportChange(event: IViewportChangeEvent)
    {
        this.viewportWidth = event.sender.width;
        this.viewportHeight = event.sender.height;
    }

    protected onTransformComponent(event: ISystemComponentEvent<Transform>)
    {
        const transform = event.component;

        if (event.add) {
            this.pickables[transform.object3D.id] = transform;
        }
        else if (event.remove) {
            this.pickables[transform.object3D.id] = undefined;
        }
    }

}
