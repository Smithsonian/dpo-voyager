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
import Viewport from "@ff/three/Viewport";
import Component from "@ff/scene/Component";
import { IPointerEvent, ITriggerEvent } from "@ff/scene/RenderView";

import ExplorerSystem, { IComponentEvent } from "../../explorer/ExplorerSystem";
import Model from "../../explorer/components/Model";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new THREE.Vector3();
const _axisZ = new THREE.Vector3(0, 0, 1);
const _mat4a = new THREE.Matrix4();
const _mat4b = new THREE.Matrix4();
const _quat0 = new THREE.Quaternion();
const _quat1 = new THREE.Quaternion();

export enum EManipMode { Off, Translate, Rotate }

export default class PoseManip extends Component
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

        const system = this.system as ExplorerSystem;
        system.on<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        system.selection.components.on(Model, this.onSelectModel, this);

    }

    dispose()
    {
        super.dispose();

        const system = this.system as ExplorerSystem;
        system.off<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        system.selection.components.on(Model, this.onSelectModel, this);
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

        console.log("PoseManip.tick - (%s, %s), %s", deltaX, deltaY, EManipMode[mode]);

        this._deltaX = this._deltaY = 0;
        const object3D = this._model.object3D;
        const camera = this._viewport.camera;

        camera.matrixWorldInverse.decompose(_vec3, _quat0, _vec3);

        if (mode === EManipMode.Rotate) {
            const angle = (deltaX + deltaY) * 0.01;
            _quat1.setFromAxisAngle(_axisZ, angle);
            _mat4b.makeRotationFromQuaternion(_quat1);
        }
        else {
            _mat4a.makeTranslation(deltaX, deltaY, 0);
            _mat4b.makeRotationFromQuaternion(_quat0);
            _mat4b.multiply(_mat4a);
        }

        object3D.matrix.multiply(_mat4b);
        object3D.matrixWorldNeedsUpdate = true;
    }

    protected onPointer(event: IPointerEvent)
    {
        if (this.ins.mode.value === EManipMode.Off || !this._model) {
            return;
        }

        if (event.type === "pointer-move" && event.originalEvent.buttons === 1) {
            this._deltaX += event.movementX;
            this._deltaY += event.movementY;
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