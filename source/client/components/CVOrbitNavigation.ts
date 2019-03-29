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

import { Box3 } from "three/src/math/Box3";

import { Node, types } from "@ff/graph/Component";

import CameraController from "@ff/three/CameraController";
import { IPointerEvent, ITriggerEvent } from "@ff/scene/RenderView";
import CScene, { IRenderContext } from "@ff/scene/components/CScene";

import { INavigation } from "common/types/setup";

import CVSetup from "./CVSetup";
import CVNavigation, { EViewPreset } from "./CVNavigation";

////////////////////////////////////////////////////////////////////////////////

const _orientationPresets = [];
_orientationPresets[EViewPreset.Left] = [ 0, -90, 0 ];
_orientationPresets[EViewPreset.Right] = [ 0, 90, 0 ];
_orientationPresets[EViewPreset.Front] = [ 0, 0, 0 ];
_orientationPresets[EViewPreset.Back] = [ 0, 180, 0 ];
_orientationPresets[EViewPreset.Top] = [ -90, 0, 0 ];
_orientationPresets[EViewPreset.Bottom] = [ 90, 0, 0 ];


const _replaceNull = function(vector: number[], replacement: number)
{
    for (let i = 0, n = vector.length; i < n; ++i) {
        vector[i] = vector[i] === null ? replacement : vector[i];
    }
    return vector;
};

/**
 * Voyager explorer orbit navigation.
 * Controls manipulation and parameters of the camera.
 */
export default class CVOrbitNavigation extends CVNavigation
{
    static readonly typeName: string = "CVOrbitNavigation";

    protected static readonly ins = {
        orbit: types.Vector3("Manip.Orbit", [ -25, -25, 0 ]),
        offset: types.Vector3("Manip.Offset", [ 0, 0, 100 ]),
        minOrbit: types.Vector3("Manip.Min.Orbit", [ -90, -Infinity, -Infinity ]),
        minOffset: types.Vector3("Manip.Min.Offset", [ -Infinity, -Infinity, 0.1 ]),
        maxOrbit: types.Vector3("Manip.Max.Orbit", [ 90, Infinity, Infinity ]),
        maxOffset: types.Vector3("Manip.Max.Offset", [ Infinity, Infinity, Infinity ]),
    };

    ins = this.addInputs<CVNavigation, typeof CVOrbitNavigation.ins>(CVOrbitNavigation.ins);

    private _controller = new CameraController();
    private _scene: CScene = null;
    private _modelBoundingBox: Box3 = null;

    constructor(node: Node, id: string)
    {
        super(node, id);
        this._scene = this.scene;
    }

    update()
    {
        const ins = this.ins;
        const controller = this._controller;

        const cameraComponent = this._scene.activeCameraComponent;
        const camera = cameraComponent ? cameraComponent.camera : null;

        const { projection, preset, orbit, offset } = ins;

        // camera projection
        if (cameraComponent && projection.changed) {
            camera.setProjection(projection.getValidatedValue());
            cameraComponent.ins.projection.setValue(projection.value, true);
        }

        // camera preset
        if (preset.changed && preset.value !== EViewPreset.None) {
            orbit.setValue(_orientationPresets[preset.getValidatedValue()].slice());
        }

        // zoom extents
        if (camera && ins.zoomExtents.changed) {
            this._modelBoundingBox = this.getComponent(CVSetup).modelBoundingBox;
            controller.zoomExtents(this._modelBoundingBox);
        }

        const { minOrbit, minOffset, maxOrbit, maxOffset} = ins;

        // orbit, offset and limits
        if (orbit.changed || offset.changed) {
            controller.orbit.fromArray(orbit.value);
            controller.offset.fromArray(offset.value);
        }

        if (minOrbit.changed || minOffset.changed || maxOrbit.changed || maxOffset.changed) {
            controller.minOrbit.fromArray(minOrbit.value);
            controller.minOffset.fromArray(minOffset.value);
            controller.maxOrbit.fromArray(maxOrbit.value);
            controller.maxOffset.fromArray(maxOffset.value);
        }

        return true;
    }

    tick()
    {
        const ins = this.ins;
        const cameraComponent = this._scene.activeCameraComponent;

        if (!ins.enabled.value || !cameraComponent) {
            return;
        }

        const controller = this._controller;
        controller.camera = cameraComponent.camera;

        const transform = cameraComponent.transform;
        const forceUpdate = this.changed;

        if (controller.updateCamera(transform.object3D, forceUpdate)) {
            controller.orbit.toArray(ins.orbit.value);
            ins.orbit.set(true);
            controller.offset.toArray(ins.offset.value);
            ins.offset.set(true);

            // if camera has moved, set preset to "None"
            if (ins.preset.value !== EViewPreset.None && !ins.preset.changed) {
                ins.preset.setValue(EViewPreset.None, true);
            }

            if (transform) {
                transform.setPropertiesFromMatrix();
            }
            else {
                cameraComponent.setPropertiesFromMatrix();
            }

            return true;
        }

        return false;
    }

    preRender(context: IRenderContext)
    {
        if (this._modelBoundingBox) {
            context.viewport.zoomExtents(this._modelBoundingBox);
        }
    }

    tock()
    {
        this._modelBoundingBox = null;
    }

    fromData(data: INavigation)
    {
        data = data || {} as INavigation;

        super.fromData(data);

        const orbit = data.orbit || {
            orbit: [ -25, -25, 0 ],
            offset: [ 0, 0, 100 ],
            minOrbit: [ -90, -Infinity, -Infinity ],
            minOffset: [ -Infinity, -Infinity, 0.1 ],
            maxOrbit: [ 90, Infinity, Infinity ],
            maxOffset: [ Infinity, Infinity, Infinity ],
        };

        this.ins.copyValues({
            orbit: orbit.orbit,
            offset: orbit.offset,
            minOrbit: _replaceNull(orbit.minOrbit, -Infinity),
            maxOrbit: _replaceNull(orbit.maxOrbit, Infinity),
            minOffset: _replaceNull(orbit.minOffset, -Infinity),
            maxOffset: _replaceNull(orbit.maxOffset, Infinity),
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

        // if viewport has it's own camera, don't handle event here
        if (viewport.camera) {
            return;
        }

        if (this.ins.enabled.value && this._scene.activeCameraComponent) {
            this._controller.setViewportSize(viewport.width, viewport.height);
            this._controller.onPointer(event);
            event.stopPropagation = true;
        }
    }

    protected onTrigger(event: ITriggerEvent)
    {
        const viewport = event.viewport;

        // if viewport has it's own camera, don't handle event here
        if (viewport.camera) {
            return;
        }

        if (this.ins.enabled.value && this._scene.activeCameraComponent) {
            this._controller.setViewportSize(viewport.width, viewport.height);
            this._controller.onTrigger(event);
            event.stopPropagation = true;
        }
    }


}