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

import { types } from "@ff/graph/propertyTypes";

import Component from "@ff/scene/Component";
import { IPointerEvent, ITriggerEvent } from "@ff/scene/RenderView";
import { IActiveCameraEvent } from "@ff/scene/RenderSystem";
import Camera, { EProjectionType } from "@ff/scene/components/Camera";

import ObjectManipulator from "@ff/three/ObjectManipulator";

////////////////////////////////////////////////////////////////////////////////

const _orientationPreset = [
    [ 0, -90, 0 ], // left
    [ 0, 90, 0 ],  // right
    [ -90, 0, 0 ], // top
    [ 90, 0, 0 ],  // bottom
    [ 0, 0, 0 ],   // front
    [ 0, 180, 0 ], // back
];

export { EProjectionType };

export enum EViewPreset { Left, Right, Top, Bottom, Front, Back, None }

/**
 * Voyager explorer view component.
 * Controls manipulation and parameters of the camera.
 */
export default class View extends Component
{
    static readonly type: string = "View";

    ins = this.ins.append({
        preset: types.Enum("View.Preset", EViewPreset, EViewPreset.None),
        projection: types.Enum("View.Projection", EProjectionType, EProjectionType.Perspective),
        enabled: types.Boolean_true("Manip.Enabled"),
        orientation: types.Vector3("Manip.Orientation", [ 0, 0, 0 ]),
        offset: types.Vector3("Manip.Offset", [ 0, 0, 50 ]),
        minOrientation: types.Vector3("Manip.Min.Orientation", [ -90, -Infinity, -Infinity ]),
        minOffset: types.Vector3("Manip.Min.Offset", [ -Infinity, -Infinity, 0.1 ]),
        maxOrientation: types.Vector3("Manip.Max.Orientation", [ 90, Infinity, Infinity ]),
        maxOffset: types.Vector3("Manip.Max.Offset", [ Infinity, Infinity, 1000 ])
    });

    outs = this.outs.append({
    });

    protected manip = new ObjectManipulator();
    protected activeCamera: Camera = null;

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

        const { projection, preset, orientation, offset, minOrientation, minOffset, maxOrientation, maxOffset } = this.ins;

        if (cameraComponent && projection.changed) {
            cameraComponent.camera.setProjection(projection.value);
            manip.orthographicMode = projection.value === EProjectionType.Orthographic;
        }

        if (preset.changed && preset.value !== EViewPreset.None) {
            orientation.setValue(_orientationPreset[types.getEnumIndex(EViewPreset, preset.value)].slice());
        }

        if (orientation.changed || offset.changed) {
            manip.orientation.fromArray(orientation.value);
            manip.offset.fromArray(offset.value);
        }

        if (minOrientation.changed || minOffset.changed || maxOrientation.changed || maxOffset.changed) {
            manip.minOrientation.fromArray(minOrientation.value);
            manip.minOffset.fromArray(minOffset.value);
            manip.maxOrientation.fromArray(maxOrientation.value);
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
                manip.orientation.toArray(ins.orientation.value);
                ins.orientation.set(true);
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