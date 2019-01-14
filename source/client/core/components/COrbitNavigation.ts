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
import { types } from "@ff/graph/propertyTypes";

import OrbitManipulator from "@ff/three/OrbitManipulator";

import RenderComponent from "@ff/scene/RenderComponent";
import { IActiveCameraEvent } from "@ff/scene/RenderSystem";
import { IPointerEvent, ITriggerEvent } from "@ff/scene/RenderView";
import CCamera, { EProjection } from "@ff/scene/components/CCamera";

import { INavigation } from "common/types/voyager";
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

export { EProjection };

export enum EViewPreset { Left, Right, Top, Bottom, Front, Back, None }

const ins = {
    preset: types.Enum("View.Preset", EViewPreset, EViewPreset.None),
    projection: types.Enum("View.Projection", EProjection, EProjection.Perspective),
    enabled: types.Boolean("Manip.Enabled", true),
    setup: types.Event("Manip.Setup"),
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
export default class COrbitNavigation extends RenderComponent
{
    static readonly type: string = "COrbitNavigation";

    ins = this.addInputs(ins);

    protected manip = new OrbitManipulator();
    protected activeCamera: CCamera = null;

    create()
    {
        super.create();

        this.manip.cameraMode = true;
        this.activeCamera = this.system.activeCameraComponent;

        this.system.on<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        this.system.on<ITriggerEvent>("wheel", this.onTrigger, this);
        this.system.on<IActiveCameraEvent>("active-camera", this.onActiveCamera, this);
    }

    dispose()
    {
        super.dispose();

        this.system.off<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        this.system.off<ITriggerEvent>("wheel", this.onTrigger, this);
        this.system.off<IActiveCameraEvent>("active-camera", this.onActiveCamera, this);
    }

    update()
    {
        const manip = this.manip;
        const cameraComponent = this.activeCamera;

        const {
            projection, preset, setup,
            orbit, offset, minOrbit, minOffset, maxOrbit, maxOffset
        } = this.ins;

        if (cameraComponent && projection.changed) {
            cameraComponent.camera.setProjection(projection.value);
            manip.orthographicMode = projection.value === EProjection.Orthographic;
        }

        if (preset.changed && preset.value !== EViewPreset.None) {
            orbit.setValue(_orientationPreset[preset.getValidatedValue()].slice());
        }

        if (setup.changed) {
            const sceneComponent = this.system.activeSceneComponent as CVoyagerScene;
            const cameraComponent = this.system.activeCameraComponent;

            if (sceneComponent && cameraComponent) {
                const camera = cameraComponent.camera;
                camera.updateMatrixWorld(false);
                _box.copy(sceneComponent.boundingBox);
                _box.applyMatrix4(camera.matrixWorldInverse);
                _box.getSize(_size);
                _box.getCenter(_center);

                const sizeXY = Math.max(_size.x / camera.aspect, _size.y);

                if (camera.isPerspectiveCamera) {
                    offset.value[2] = _size.z + sizeXY * 0.5 + sizeXY / (2 * Math.tan(camera.fov * math.DEG2RAD * 0.5));
                }
                else {
                    offset.value[2] = _size.z * 2;
                }

                offset.set();
            }
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
        const manip = this.manip;
        const cameraComponent = this.activeCamera;
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

            if (cameraComponent && (manipUpdated || this.updated)) {
                const camera = cameraComponent.camera;
                const transformComponent = cameraComponent.transform;

                if (transformComponent) {
                    this.manip.toObject(transformComponent.object3D);
                }
                else {
                    this.manip.toObject(camera);
                }

                if (camera.isOrthographicCamera) {
                    camera.size = this.manip.offset.z;
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
            minOrbit: orbit.minOrbit,
            maxOrbit: orbit.maxOrbit,
            minOffset: orbit.minOffset,
            maxOffset: orbit.maxOffset
        });
    }

    toData(): INavigation
    {
        const ins = this.ins;

        return {
            type: "Orbit",
            enabled: ins.enabled.value,
            orbit: {
                minOrbit: ins.minOrbit.cloneValue(),
                maxOrbit: ins.maxOrbit.cloneValue(),
                minOffset: ins.minOffset.cloneValue(),
                maxOffset: ins.maxOffset.cloneValue()
            }
        };
    }

    protected onPointer(event: IPointerEvent)
    {
        const viewport = event.viewport;
        if (viewport.viewportCamera) {
            return;
        }

        if (this.ins.enabled.value && this.activeCamera) {
            this.manip.setViewportSize(viewport.width, viewport.height);
            this.manip.onPointer(event);
            event.stopPropagation = true;
        }
    }

    protected onTrigger(event: ITriggerEvent)
    {
        const viewport = event.viewport;
        if (viewport.viewportCamera) {
            return;
        }

        if (this.ins.enabled.value && this.activeCamera) {
            this.manip.setViewportSize(viewport.width, viewport.height);
            this.manip.onTrigger(event);
            event.stopPropagation = true;
        }
    }

    protected onActiveCamera(event: IActiveCameraEvent)
    {
        this.activeCamera = event.next;
    }
}