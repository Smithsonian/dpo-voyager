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

import math from "@ff/core/math";
import Vector3 from "@ff/core/Vector3";

import { types } from "@ff/graph/propertyTypes";
import Component from "@ff/graph/Component";

import OrbitManipulator from "@ff/three/OrbitManipulator";

import { IPointerEvent, ITriggerEvent } from "@ff/scene/RenderView";
import CRenderer, { IActiveSceneEvent } from "@ff/scene/components/CRenderer";
import { EProjection } from "@ff/scene/components/CCamera";

import { INavigation } from "common/types/setup";

import CVoyagerScene from "./CVoyagerScene";

////////////////////////////////////////////////////////////////////////////////

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();
const _translation = new THREE.Vector3();

const _orientationPreset = [
    [ 0, -90, 0 ], // left
    [ 0, 90, 0 ],  // right
    [ -90, 0, 0 ], // top
    [ 90, 0, 0 ],  // bottom
    [ 0, 0, 0 ],   // front
    [ 0, 180, 0 ], // back
];

const _replaceNull = function(vector: number[], replacement: number)
{
    for (let i = 0, n = vector.length; i < n; ++i) {
        vector[i] = vector[i] === null ? replacement : vector[i];
    }
    return vector;
};

export { EProjection };

export enum EViewPreset { Left, Right, Top, Bottom, Front, Back, None }

const ins = {
    preset: types.Enum("View.Preset", EViewPreset, EViewPreset.None),
    projection: types.Enum("View.Projection", EProjection, EProjection.Perspective),
    enabled: types.Boolean("Manip.Enabled", true),
    zoomExtents: types.Event("Manip.ZoomExtents"),
    orbit: types.Vector3("Manip.Orbit", [ -25, -25, 0 ]),
    offset: types.Vector3("Manip.Offset", [ 0, 0, 100 ]),
    minOrbit: types.Vector3("Manip.Min.Orbit", [ -90, -Infinity, -Infinity ]),
    minOffset: types.Vector3("Manip.Min.Offset", [ -Infinity, -Infinity, 0.1 ]),
    maxOrbit: types.Vector3("Manip.Max.Orbit", [ 90, Infinity, Infinity ]),
    maxOffset: types.Vector3("Manip.Max.Offset", [ Infinity, Infinity, Infinity ])
};

/**
 * Voyager explorer orbit navigation.
 * Controls manipulation and parameters of the camera.
 */
export default class COrbitNavigation extends Component
{
    static readonly type: string = "COrbitNavigation";

    ins = this.addInputs(ins);

    private _manip = new OrbitManipulator();
    private _activeScene: CVoyagerScene = null;

    get renderer() {
        return this.system.graph.components.safeGet(CRenderer);
    }

    create()
    {
        super.create();

        this._manip.cameraMode = true;

        this.system.on<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        this.system.on<ITriggerEvent>("wheel", this.onTrigger, this);

        this._activeScene = this.renderer.activeSceneComponent as CVoyagerScene;
        this.renderer.on<IActiveSceneEvent>("active-scene", this.onActiveScene, this);
    }

    dispose()
    {
        super.dispose();

        this.system.off<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        this.system.off<ITriggerEvent>("wheel", this.onTrigger, this);

        this.renderer.off<IActiveSceneEvent>("active-scene", this.onActiveScene, this);
        this._activeScene = null;
    }

    update()
    {
        const manip = this._manip;

        const component = this._activeScene ? this._activeScene.activeCameraComponent : null;
        const camera = component ? component.camera : null;

        const {
            projection, preset, zoomExtents,
            orbit, offset, minOrbit, minOffset, maxOrbit, maxOffset
        } = this.ins;

        if (camera && projection.changed) {
            camera.setProjection(projection.value);
            manip.orthographicMode = projection.value === EProjection.Orthographic;
        }

        if (preset.changed && preset.value !== EViewPreset.None) {
            orbit.setValue(_orientationPreset[preset.getValidatedValue()].slice());
        }

        if (zoomExtents.changed && this._activeScene) {
            camera.updateMatrixWorld(false);
            _box.copy(this._activeScene.boundingBox);
            _box.applyMatrix4(camera.matrixWorldInverse);
            _box.getSize(_size);
            _box.getCenter(_center);

            const sizeXY = 0.75 * Math.max(_size.x, _size.y, _size.z);

            if (camera.isPerspectiveCamera) {
                offset.value[2] = sizeXY + sizeXY / (2 * Math.tan(camera.fov * math.DEG2RAD * 0.5));
            }
            else {
                offset.value[2] = _size.z * 2;
            }

            offset.set();
        }

        if (orbit.changed || offset.changed) {
            manip.orbit.fromArray(orbit.value);
            manip.offset.fromArray(offset.value);
        }

        if (minOrbit.changed || minOffset.changed || maxOrbit.changed || maxOffset.changed) {
            manip.minOrbit.fromArray(minOrbit.value);
            manip.minOffset.fromArray(minOffset.value);
            manip.maxOrbit.fromArray(maxOrbit.value);
            manip.maxOffset.fromArray(maxOffset.value);
        }

        return true;
    }

    tick()
    {
        const manip = this._manip;
        const component = this._activeScene && this._activeScene.activeCameraComponent;
        const ins = this.ins;


        if (ins.enabled.value) {

            const manipUpdated = manip.update();

            if (manipUpdated) {
                manip.orbit.toArray(ins.orbit.value);
                ins.orbit.set(true);
                manip.offset.toArray(ins.offset.value);
                ins.offset.set(true);
                ins.preset.setValue(EViewPreset.None, true);
            }

            if (component && (manipUpdated || this.updated)) {
                const camera = component.camera;
                const transformComponent = component.transform;

                if (transformComponent) {
                    this._manip.toObject(transformComponent.object3D);
                }
                else {
                    this._manip.toObject(camera);
                }

                if (camera.isOrthographicCamera) {
                    camera.size = this._manip.offset.z;
                    camera.updateProjectionMatrix();
                }

                return true;
            }
        }

        return false;
    }

    fromData(data: INavigation)
    {
        const orbit = data.orbit;

        this.ins.copyValues({
            enabled: data.enabled,
            orbit: orbit.orbit.slice(),
            offset: orbit.offset.slice(),
            minOrbit: _replaceNull(orbit.minOrbit.slice(), -Infinity),
            maxOrbit: _replaceNull(orbit.maxOrbit.slice(), Infinity),
            minOffset: _replaceNull(orbit.minOffset.slice(), -Infinity),
            maxOffset: _replaceNull(orbit.maxOffset.slice(), Infinity),
        });
    }

    toData(): INavigation
    {
        const ins = this.ins;

        return {
            type: "Orbit",
            enabled: ins.enabled.value,
            orbit: {
                orbit: ins.orbit.cloneValue(),
                offset: ins.offset.cloneValue(),
                minOrbit: ins.minOrbit.cloneValue(),
                maxOrbit: ins.maxOrbit.cloneValue(),
                minOffset: ins.minOffset.cloneValue(),
                maxOffset: ins.maxOffset.cloneValue(),
            }
        };
    }

    protected onPointer(event: IPointerEvent)
    {
        const viewport = event.viewport;
        if (viewport.viewportCamera) {
            return;
        }

        if (this.ins.enabled.value && this._activeScene && this._activeScene.activeCameraComponent) {
            this._manip.setViewportSize(viewport.width, viewport.height);
            this._manip.onPointer(event);
            event.stopPropagation = true;
        }
    }

    protected onTrigger(event: ITriggerEvent)
    {
        const viewport = event.viewport;
        if (viewport.viewportCamera) {
            return;
        }

        if (this.ins.enabled.value && this._activeScene && this._activeScene.activeCameraComponent) {
            this._manip.setViewportSize(viewport.width, viewport.height);
            this._manip.onTrigger(event);
            event.stopPropagation = true;
        }
    }

    protected onActiveScene(event: IActiveSceneEvent)
    {
        if (event.next instanceof CVoyagerScene) {
            this._activeScene = event.next;
            this.ins.zoomExtents.set();
        }
    }
}