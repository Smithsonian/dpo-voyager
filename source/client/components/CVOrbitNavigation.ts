/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import { Box3 } from "three";

import CObject3D, { Node, types } from "@ff/scene/components/CObject3D";

import CameraController from "@ff/three/CameraController";
import { IKeyboardEvent, IPointerEvent, ITriggerEvent } from "@ff/scene/RenderView";
import CScene, { IRenderContext } from "@ff/scene/components/CScene";
import CTransform, { ERotationOrder } from "@ff/scene/components/CTransform";
import { EProjection } from "@ff/three/UniversalCamera";

import { INavigation } from "client/schema/setup";

import CVScene from "./CVScene";
import CVAssetManager from "./CVAssetManager";
import CVARManager from "./CVARManager";

////////////////////////////////////////////////////////////////////////////////

export { EProjection };

export enum EViewPreset { Left, Right, Top, Bottom, Front, Back, None };
export enum EKeyNavMode { Orbit, Zoom, Pan };

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
        pointerEnabled: types.Boolean("Settings.PointerEnabled", true),
        promptEnabled: types.Boolean("Settings.PromptEnabled", true),
        isInUse: types.Boolean("Camera.IsInUse", false),
        preset: types.Enum("Camera.ViewPreset", EViewPreset, EViewPreset.None),
        projection: types.Enum("Camera.Projection", EProjection, EProjection.Perspective),
        lightsFollowCamera: types.Boolean("Navigation.LightsFollowCam", true),
        autoRotation: types.Boolean("Navigation.AutoRotation", false),
        autoRotationSpeed: types.Number("Navigation.AutoRotationSpeed", 10),
        zoomExtents: types.Event("Settings.ZoomExtents"),
        autoZoom: types.Boolean("Settings.AutoZoom", true),
        orbit: types.Vector3("Current.Orbit", [ -25, -25, 0 ]),
        offset: types.Vector3("Current.Offset", [ 0, 0, 100 ]),
        minOrbit: types.Vector3("Limits.Min.Orbit", [ -90, -Infinity, -Infinity ]),
        minOffset: types.Vector3("Limits.Min.Offset", [ -Infinity, -Infinity, 0.1 ]),
        maxOrbit: types.Vector3("Limits.Max.Orbit", [ 90, Infinity, Infinity ]),
        maxOffset: types.Vector3("Limits.Max.Offset", [ Infinity, Infinity, Infinity ]),
        keyNavActive: types.Enum("Navigation.KeyNavActive", EKeyNavMode),
        promptActive: types.Boolean("Navigation.PromptActive", false)
    };

    ins = this.addInputs<CObject3D, typeof CVOrbitNavigation.ins>(CVOrbitNavigation.ins);

    private _controller = new CameraController();
    private _scene: CScene = null;
    private _modelBoundingBox: Box3 = null;
    private _hasChanged = false;
    private _hasZoomed = false;
    private _isAutoZooming = false;
    private _autoRotationStartTime = null;
    private _initYOrbit = null;

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
            this.ins.autoRotationSpeed,
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
    protected get sceneNode() {
        return this.getSystemComponent(CVScene);
    }
    protected get arManager() {  // HACK - need a centralized place to reference shadowRoot of this instance
        return this.getSystemComponent(CVARManager);
    }

    create()
    {
        super.create();

        this.system.on<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        this.system.on<ITriggerEvent>("wheel", this.onTrigger, this);
        this.system.on<IKeyboardEvent>("keydown", this.onKeyboard, this);

        this.assetManager.outs.completed.on("value", this.onLoadingCompleted, this);
    }

    dispose()
    {
        this.assetManager.outs.completed.off("value", this.onLoadingCompleted, this);

        this.system.off<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        this.system.off<ITriggerEvent>("wheel", this.onTrigger, this);
        this.system.off<IKeyboardEvent>("keydown", this.onKeyboard, this);

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

        // zoom extents
        if (camera && ins.zoomExtents.changed) {
            const scene = this.getGraphComponent(CVScene);
            if(scene.models.some(model => model.outs.updated.changed)) {
                scene.update(null);
            }
            this._modelBoundingBox = scene.outs.boundingBox.value;
            if(this._isAutoZooming && (!this.ins.autoZoom.value || this._modelBoundingBox.isEmpty())) {
                /*edge case when loaded event triggers before document parsing */
            }
            else {
                // Hack until we have a better way to make sure camera is initialized on first zoom
                if(controller.camera) {
                    cameraComponent.camera.aspect = controller.camera.aspect;
                }

                controller.camera = cameraComponent.camera;
            
                controller.zoomExtents(this._modelBoundingBox);
                cameraComponent.ins.zoom.set();
                this._hasZoomed = true;
            }
            this._isAutoZooming = false;
        }

        // auto rotate
        if (ins.autoRotation.changed) {
            this._autoRotationStartTime = ins.autoRotation.value ? performance.now() : null;
        }
        if (ins.promptActive.changed && !this._autoRotationStartTime) {
            this._initYOrbit = controller.orbit.y;
            this._autoRotationStartTime = ins.promptActive.value ? performance.now() : null;
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
        const forceUpdate = this.changed || ins.autoRotation.value || ins.promptActive.value;

        if ((ins.autoRotation.value || ins.promptActive.value) && this._autoRotationStartTime) {
            const now = performance.now();
            const delta = (now - this._autoRotationStartTime) * 0.001;
            if(ins.autoRotation.value) {
                // auto-rotation function
                controller.orbit.y = (controller.orbit.y + ins.autoRotationSpeed.value * delta) % 360.0;
                this._autoRotationStartTime = now;
            }
            else {
                const prompt = this.arManager.shadowRoot.getElementById("prompt") as HTMLElement;

                if(prompt) {
                    // prompt rotation function
                    const pause = 2.0;
                    const period = 1.5;
                    const cycle = 2.0 * period;
                    const fadeLength = 0.2 * period;
                    let deltaMod = delta % (cycle + pause);
                    if(deltaMod > cycle && deltaMod < cycle + pause) {
                        prompt.style.opacity = deltaMod < cycle + fadeLength ? `${1.0 - ((deltaMod - cycle) / fadeLength)}` : "0.0";
                        deltaMod = 0.0;
                    }
                    else if(deltaMod < fadeLength) {
                        prompt.style.opacity = deltaMod < fadeLength ? `${deltaMod / fadeLength}` : "1.0";
                    }
                    
                    const promptOffset = Math.sin((deltaMod/period) * Math.PI) * 20.0;
                    controller.orbit.y = this._initYOrbit + promptOffset;
            
                    prompt.style.transform = `translateX(${-4*promptOffset}px)`;
                }
            }
        }

        if (controller.updateCamera(transform.object3D, forceUpdate)) {
            controller.orbit.toArray(ins.orbit.value);
            ins.orbit.set(true);
            controller.offset.toArray(ins.offset.value);
            ins.offset.set(true);

            // if camera has moved, set preset to "None"
            if (ins.preset.value !== EViewPreset.None && !ins.preset.changed) {
                ins.preset.setValue(EViewPreset.None, true);
            }
            
            if(!ins.isInUse.value && this._hasChanged) {
                ins.isInUse.setValue(true);
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

    setChanged(changed: boolean)
    {
        this._hasChanged = changed;
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
            if (event.type === "pointer-down" && window.getSelection().type !== "None") {
                window.getSelection().removeAllRanges();
            }
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

    protected onKeyboard(event: IKeyboardEvent)
    {
        const viewport = event.viewport;

        // if viewport has it's own camera, don't handle event here
        if (viewport.camera) {
            return;
        }

        if (this.ins.enabled.value && this._scene.activeCameraComponent) {
            if(event.key.includes("Arrow")) {
                if(event.ctrlKey) {
                    this.ins.keyNavActive.setValue(EKeyNavMode.Zoom);
                }
                else if(event.shiftKey) {
                    this.ins.keyNavActive.setValue(EKeyNavMode.Pan);
                }
                else {
                    this.ins.keyNavActive.setValue(EKeyNavMode.Orbit);
                }
            }
            this._controller.setViewportSize(viewport.width, viewport.height);
            if(this._controller.onKeypress(event)) {
                event.originalEvent.preventDefault();
            }
            event.stopPropagation = true;
        }

        this._hasChanged = true;
    }

    protected onLoadingCompleted(isLoading: boolean)
    {
        if (this.ins.autoZoom.value && (!this._hasChanged || !this._hasZoomed)) {
            this.ins.zoomExtents.set();
            this._isAutoZooming = true;
        }
    }
}