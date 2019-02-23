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
import { IPointerEvent, ITriggerEvent } from "@ff/scene/RenderView";

import { INavigation } from "common/types/features";

import CVNavigation, { EViewPreset, EProjection } from "./CVNavigation";

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


const _inputs = {
    orbit: types.Vector3("Manip.Orbit", [ -25, -25, 0 ]),
    offset: types.Vector3("Manip.Offset", [ 0, 0, 100 ]),
    minOrbit: types.Vector3("Manip.Min.Orbit", [ -90, -Infinity, -Infinity ]),
    minOffset: types.Vector3("Manip.Min.Offset", [ -Infinity, -Infinity, 0.1 ]),
    maxOrbit: types.Vector3("Manip.Max.Orbit", [ 90, Infinity, Infinity ]),
    maxOffset: types.Vector3("Manip.Max.Offset", [ Infinity, Infinity, Infinity ]),
};

const _outputs = {
};

/**
 * Voyager explorer orbit navigation.
 * Controls manipulation and parameters of the camera.
 */
export default class CVOrbitNavigation extends CVNavigation
{
    static readonly typeName: string = "CVOrbitNavigation";

    ins = this.addInputs<CVNavigation, typeof _inputs>(_inputs);
    outs = this.addOutputs<CVNavigation, typeof _outputs>(_outputs);

    private _manip = new OrbitManipulator();


    create()
    {
        super.create();

        this._manip.cameraMode = true;
    }

    dispose()
    {
        super.dispose();
    }

    update()
    {
        const ins = this.ins;
        const manip = this._manip;

        const cameraComponent = this.activeCamera;
        const camera = cameraComponent ? cameraComponent.camera : null;

        const { projection, preset, orbit, offset } = ins;

        // camera projection
        if (camera && projection.changed) {
            camera.setProjection(projection.value);
            manip.orthographicMode = projection.value === EProjection.Orthographic;
        }

        // camera preset
        if (preset.changed && preset.value !== EViewPreset.None) {
            orbit.setValue(_orientationPreset[preset.getValidatedValue()].slice());
        }

        // zoom extent
        if (camera && ins.zoomExtent.changed) {
            manip.zoomExtent(this.activeScene.boundingBox, camera.fov);
        }

        const { minOrbit, minOffset, maxOrbit, maxOffset} = ins;

        // orbit, offset and limits
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
                const parentComponent = cameraComponent.parentComponent;

                if (parentComponent) {
                    this._manip.toObject(parentComponent.object3D);
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
        super.fromData(data);

        const orbit = data.orbit;

        this.ins.copyValues({
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
        const data = super.toData();

        data.type = "Orbit";
        data.orbit = {
            orbit: ins.orbit.cloneValue(),
            offset: ins.offset.cloneValue(),
            minOrbit: ins.minOrbit.cloneValue(),
            maxOrbit: ins.maxOrbit.cloneValue(),
            minOffset: ins.minOffset.cloneValue(),
            maxOffset: ins.maxOffset.cloneValue(),
        };

        return data as INavigation;
    }

    protected onPointer(event: IPointerEvent)
    {
        const viewport = event.viewport;
        if (viewport.camera) {
            return;
        }

        if (this.ins.enabled.value && this.activeCamera) {
            this._manip.setViewportSize(viewport.width, viewport.height);
            this._manip.onPointer(event);
            event.stopPropagation = true;
        }
    }

    protected onTrigger(event: ITriggerEvent)
    {
        const viewport = event.viewport;
        if (viewport.camera) {
            return;
        }

        if (this.ins.enabled.value && this.activeCamera) {
            this._manip.setViewportSize(viewport.width, viewport.height);
            this._manip.onTrigger(event);
            event.stopPropagation = true;
        }
    }


}