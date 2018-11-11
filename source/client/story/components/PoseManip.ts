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

import types from "@ff/core/ecs/propertyTypes";

import Manip, { IViewportPointerEvent, IViewportTriggerEvent } from "../../core/components/Manip";
import { EViewportCameraView } from "../../core/app/Viewport";
import Model from "../../core/components/Model";
import Scene from "../../core/components/Scene";
import Renderer from "../../core/components/Renderer";

////////////////////////////////////////////////////////////////////////////////

export enum EPoseManipMode { Off, Translate, Rotate, Scale }

const _axis = new THREE.Vector3();
const _quat = new THREE.Quaternion();

const _posAxisX = [
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
];

const _posAxisY = [
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 1, 0),
];

const _rotAxis = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
];

export default class PoseManip extends Manip
{
    static readonly type: string = "PoseManip";

    protected mode: EPoseManipMode = EPoseManipMode.Off;
    protected activeMode: EPoseManipMode = EPoseManipMode.Off;
    protected activeView: EViewportCameraView = EViewportCameraView.Left;

    protected parent: THREE.Object3D;
    protected model: Model;

    protected deltaX = 0;
    protected deltaY = 0;

    protected updatePose: boolean = false;
    protected viewportFactor = 1;
    protected viewportWidth = 100;

    setMode(mode: EPoseManipMode)
    {
        this.mode = mode;
    }

    attachModel(model: Model)
    {
        if (this.model) {
            this.parent.add(this.model.object3D);
        }

        this.model = model;

        if (model) {
            const scene = model.transform.getNearestAncestor(Scene);
            this.parent = model.object3D.parent;
            scene.scene.add(model.object3D);

            const models = this.getComponents(Model, true);
            models.forEach(aModel => {
                if (aModel !== model) {
                    aModel.object3D.visible = false;
                }
            });
        }
        else {
            const models = this.getComponents(Model, true);
            models.forEach(model => model.object3D.visible = true);
        }
    }

    tick()
    {
        if (this.activeMode !== EPoseManipMode.Off
            && this.model
            && (this.deltaX !== 0 || this.deltaY !== 0)) {

            const view = this.activeView;
            const object3D = this.model.object3D;
            const invGlobalScaling = 1;// / this.getComponent(Renderer).globalScaling;

            const dx = this.deltaX * this.viewportFactor * invGlobalScaling;
            const dy = this.deltaY * this.viewportFactor * invGlobalScaling;
            const delta = (this.deltaX + this.deltaY) / this.viewportWidth;

            switch (this.activeMode) {
                case EPoseManipMode.Translate:
                    _quat.copy(object3D.quaternion);
                    _quat.inverse();
                    _axis.copy(_posAxisX[view]);
                    _axis.applyQuaternion(_quat);
                    object3D.translateOnAxis(_axis, dx);
                    _axis.copy(_posAxisY[view]);
                    _axis.applyQuaternion(_quat);
                    object3D.translateOnAxis(_axis, dy);
                    break;

                case EPoseManipMode.Rotate:
                    object3D.rotateOnWorldAxis(_rotAxis[view], delta * 0.3);
                    break;

                case EPoseManipMode.Scale:
                    object3D.scale.multiplyScalar(delta * 0.2 + 1);
                    break;

            }

            object3D.updateMatrix();
            this.model.updatePropsFromMatrix();

            this.deltaX = 0;
            this.deltaY = 0;
        }
    }

    onPointer(event: IViewportPointerEvent)
    {
        const viewport = event.viewport;
        if (!viewport) {
            return super.onPointer(event);
        }

        this.viewportFactor = viewport.getTranslationFactor();

        if (event.isPrimary && event.type === "down") {
            if (this.mode !== EPoseManipMode.Off && event.originalEvent.button === 0) {

                this.activeView = viewport.viewportCameraView;
                this.activeMode = this.mode;

                if (this.mode === EPoseManipMode.Translate) {
                    if (event.ctrlKey) {
                        this.activeMode = EPoseManipMode.Rotate;
                    }
                }
            }
            else {
                this.activeMode = EPoseManipMode.Off;
            }

            this.deltaX = 0;
            this.deltaY = 0;
        }

        if (this.activeMode !== EPoseManipMode.Off
            && event.pointerCount > 0 && event.type === "move") {

            const speed = event.ctrlKey ? 0.1 : (event.shiftKey ? 10 : 1);
            this.deltaX += event.movementX * speed;
            this.deltaY -= event.movementY * speed;
            return true;
        }

        return super.onPointer(event);
    }

    onTrigger(event: IViewportTriggerEvent)
    {
        return super.onTrigger(event);
    }
}