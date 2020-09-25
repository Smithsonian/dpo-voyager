/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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
import hotkeys from "hotkeys-js";

import CObject3D, { Node, types } from "@ff/scene/components/CObject3D";

import CameraController from "@ff/three/CameraController";
import { IPointerEvent, ITriggerEvent } from "@ff/scene/RenderView";
import CScene, { IRenderContext } from "@ff/scene/components/CScene";
import CTransform, { ERotationOrder } from "@ff/scene/components/CTransform";
import { EProjection } from "@ff/three/UniversalCamera";

import { INavigation } from "client/schema/setup";

import CVScene from "./CVScene";
import CVAssetManager from "./CVAssetManager";

////////////////////////////////////////////////////////////////////////////////

export { EProjection };

export enum EViewPreset { Left, Right, Top, Bottom, Front, Back, None }


const _vec3 = new THREE.Vector3();

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
export default class CVOrbitNavigation extends CObject3D
{
    static readonly typeName: string = "CVOrbitNavigation";

    static readonly text: string = "Orbit Navigation";
    static readonly icon: string = "";

    protected static readonly ins = {
        enabled: types.Boolean("Settings.Enabled", true),
        preset: types.Enum("Camera.ViewPreset", EViewPreset, EViewPreset.None),
        projection: types.Enum("Camera.Projection", EProjection, EProjection.Perspective),
        lightsFollowCamera: types.Boolean("Navigation.LightsFollowCam", true),
        autoRotation: types.Boolean("Navigation.AutoRotation", false),
        zoomExtents: types.Event("Settings.ZoomExtents"),
        autoZoom: types.Boolean("Settings.AutoZoom", true),
        orbit: types.Vector3("Current.Orbit", [ -25, -25, 0 ]),
        offset: types.Vector3("Current.Offset", [ 0, 0, 100 ]),
        minOrbit: types.Vector3("Limits.Min.Orbit", [ -90, -Infinity, -Infinity ]),
        minOffset: types.Vector3("Limits.Min.Offset", [ -Infinity, -Infinity, 0.1 ]),
        maxOrbit: types.Vector3("Limits.Max.Orbit", [ 90, Infinity, Infinity ]),
        maxOffset: types.Vector3("Limits.Max.Offset", [ Infinity, Infinity, Infinity ]),
    };

    ins = this.addInputs<CObject3D, typeof CVOrbitNavigation.ins>(CVOrbitNavigation.ins);

    private _controller = new CameraController();
    private _scene: CScene = null;
    private _modelBoundingBox: THREE.Box3 = null;
    private _hasChanged = false;

    constructor(node: Node, id: string)
    {
        super(node, id);
        this._scene = this.scene;
    }

    get settingProperties() {
        return [
            this.ins.enabled,
            this.ins.orbit,
            this.ins.offset,
            this.ins.autoZoom,
            this.ins.autoRotation,
            this.ins.lightsFollowCamera,
            this.ins.minOrbit,
            this.ins.minOffset,
            this.ins.maxOrbit,
            this.ins.maxOffset,
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.orbit,
            this.ins.offset,
        ];
    }

    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }

    create()
    {
        super.create();

        this.system.on<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        this.system.on<ITriggerEvent>("wheel", this.onTrigger, this);

        this.assetManager.outs.completed.on("value", this.onLoadingCompleted, this);
    }

    dispose()
    {
        this.assetManager.outs.completed.off("value", this.onLoadingCompleted, this);

        this.system.off<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        this.system.off<ITriggerEvent>("wheel", this.onTrigger, this);

        super.dispose();
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
            const scene = this.getGraphComponent(CVScene);
            this._modelBoundingBox = scene.outs.boundingBox.value;
            controller.zoomExtents(this._modelBoundingBox);
        }

        // include lights
        if (ins.lightsFollowCamera.changed) {
            const lightTransform = this.getLightTransform();
            if (lightTransform) {
                if (ins.lightsFollowCamera.value) {
                    lightTransform.ins.order.setValue(ERotationOrder.ZXY);
                    lightTransform.ins.rotation.reset();
                    lightTransform.ins.rotation.linkFrom(orbit, 1, 1);
                }
                else {
                    lightTransform.ins.rotation.unlinkFrom(orbit, 1, 1);
                    lightTransform.ins.rotation.reset();
                }
            }
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
        return false;
    }

    fromData(data: INavigation)
    {
        data = data || {} as INavigation;

        const orbit = data.orbit || {
            orbit: [ -25, -25, 0 ],
            offset: [ 0, 0, 100 ],
            minOrbit: [ -90, -Infinity, -Infinity ],
            minOffset: [ -Infinity, -Infinity, 0.1 ],
            maxOrbit: [ 90, Infinity, Infinity ],
            maxOffset: [ Infinity, Infinity, Infinity ],
        };

        this.ins.copyValues({
            enabled: !!data.enabled,
            autoZoom: !!data.autoZoom,
            autoRotation: !!data.autoRotation,
            lightsFollowCamera: !!data.lightsFollowCamera,
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
        const data: Partial<INavigation> = {};

        data.enabled = ins.enabled.value;
        data.autoZoom = ins.autoZoom.value;
        data.autoRotation = ins.autoRotation.value;
        data.lightsFollowCamera = ins.lightsFollowCamera.value;

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

    protected getLightTransform()
    {
        const lights = this.graph.findNodeByName("Lights");
        return lights && lights.getComponent(CTransform, true);
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

        this._hasChanged = true;
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

        this._hasChanged = true;
    }

    protected onLoadingCompleted(isLoading: boolean)
    {
        if (this.ins.autoZoom.value && !this._hasChanged) {
            this.ins.zoomExtents.set();
        }
    }
}