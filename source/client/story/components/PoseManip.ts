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

import { types } from "@ff/graph/propertyTypes";
import { IPointerEvent } from "@ff/scene/RenderView";
import Viewport from "@ff/three/Viewport";
import { computeLocalBoundingBox } from "@ff/three/helpers";

import Model from "../../core/components/Model";
import ExplorerComponent from "../../explorer/ExplorerComponent";
import { IComponentEvent } from "../../explorer/ExplorerSystem";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat0 = new THREE.Quaternion();
const _quat1 = new THREE.Quaternion();
const _box = new THREE.Box3();

export enum EManipMode { Off, Translate, Rotate }

export default class PoseManip extends ExplorerComponent
{
    static readonly type: string = "PoseManip";

    ins = this.ins.append({
        mode: types.Enum("Mode", EManipMode, EManipMode.Off)
    });

    protected _model: Model = null;
    protected _viewport: Viewport = null;
    protected _deltaX = 0;
    protected _deltaY = 0;

    create()
    {
        super.create();

        const system = this.system;
        system.on<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        system.selectionController.components.on(Model, this.onSelectModel, this);

    }

    dispose()
    {
        super.dispose();

        const system = this.system;
        system.off<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        system.selectionController.components.on(Model, this.onSelectModel, this);
    }

    tick()
    {
        const mode = this.ins.mode.value;
        if (mode === EManipMode.Off || !this._model) {
            return false;
        }

        const deltaX = this._deltaX;
        const deltaY = this._deltaY;

        if (deltaX === 0 && deltaY === 0) {
            return false;
        }

        this._deltaX = this._deltaY = 0;

        const object3D = this._model.object3D;
        const camera = this._viewport.viewportCamera;
        if (!camera) {
            return false;
        }

        camera.matrixWorld.decompose(_vec3a, _quat0, _vec3a);

        if (mode === EManipMode.Rotate) {
            const angle = (deltaX - deltaY) * 0.002;
            _axis.set(0, 0, -1).applyQuaternion(_quat0);
            _quat1.setFromAxisAngle(_axis, angle);
            _mat4.makeRotationFromQuaternion(_quat1);
        }
        else {
            const f = camera.size / this._viewport.width;
            _axis.set(deltaX * f, -deltaY * f, 0).applyQuaternion(_quat0);
            _mat4.identity().setPosition(_axis);
        }

        _mat4.multiply(object3D.matrix);
        this._model.setFromMatrix(_mat4);

        return true;
    }

    protected onPointer(event: IPointerEvent)
    {
        if (this.ins.mode.value === EManipMode.Off || !this._model) {
            return;
        }

        if (event.type === "pointer-move" && event.originalEvent.buttons === 1) {
            const speed = event.ctrlKey ? 0.1 : (event.shiftKey ? 10 : 1);
            this._deltaX += event.movementX * speed;
            this._deltaY += event.movementY * speed;
            this._viewport = event.viewport;
            event.stopPropagation = true;
        }
    }

    protected onSelectModel(event: IComponentEvent<Model>)
    {
        if (event.add) {
            this._model = event.component;
        }
        else {
            this._model = null;
        }
    }
}