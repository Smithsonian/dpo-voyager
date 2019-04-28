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

import { Node, types } from "@ff/graph/Component";

import Viewport from "@ff/three/Viewport";

import RenderQuadView, { EQuadViewLayout, IPointerEvent } from "@ff/scene/RenderQuadView";
import CRenderer from "@ff/scene/components/CRenderer";

import NVNode from "../nodes/NVNode";

import CVModel2 from "./CVModel2";
import CVTask from "./CVTask";

import PoseTaskView from "../ui/story/PoseTaskView";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat0 = new THREE.Quaternion();
const _quat1 = new THREE.Quaternion();

export enum EPoseManipMode { Off, Translate, Rotate }


export default class CVPoseTask extends CVTask
{
    static readonly typeName: string = "CVPoseTask";

    static readonly text: string = "Pose";
    static readonly icon: string = "move";

    protected static readonly ins = {
        mode: types.Enum("Pose.Mode", EPoseManipMode, EPoseManipMode.Off)
    };

    ins = this.addInputs<CVTask, typeof CVPoseTask.ins>(CVPoseTask.ins);

    private _viewport: Viewport = null;
    private _deltaX = 0;
    private _deltaY = 0;

    protected activeModel: CVModel2 = null;

    constructor(node: Node, id: string)
    {
        super(node, id);

        const configuration = this.configuration;
        configuration.gridVisible = true;
        configuration.annotationsVisible = false;
        configuration.interfaceVisible = false;
        configuration.bracketsVisible = true;
    }

    protected get renderer() {
        return this.getMainComponent(CRenderer);
    }

    createView()
    {
        return new PoseTaskView(this);
    }

    activateTask()
    {
        //this.selection.selectedComponents.on(CVModel2, this.onSelectModel, this);
        this.system.on<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);

        // switch to quad view layout
        this.renderer.views.forEach(view => {
            if (view instanceof RenderQuadView) {
                view.layout = EQuadViewLayout.Quad;
            }
        });

        super.activateTask();
    }

    deactivateTask()
    {
        super.deactivateTask();

        //this.selection.selectedComponents.off(CVModel2, this.onSelectModel, this);
        this.system.off<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);

        // switch back to single view layout
        this.renderer.views.forEach(view => {
            if (view instanceof RenderQuadView) {
                view.layout = EQuadViewLayout.Single;
            }
        });
    }

    update(context)
    {
        return true;
    }

    tick()
    {
        if (!this.isActiveTask) {
            return false;
        }

        const mode = this.ins.mode.value;
        if (mode === EPoseManipMode.Off || !this.activeNode.model) {
            return false;
        }

        const deltaX = this._deltaX;
        const deltaY = this._deltaY;

        if (deltaX === 0 && deltaY === 0) {
            return false;
        }

        this._deltaX = this._deltaY = 0;

        const object3D = this.activeModel.object3D;
        const camera = this._viewport.camera;
        if (!camera) {
            return false;
        }

        camera.matrixWorld.decompose(_vec3a, _quat0, _vec3a);

        if (mode === EPoseManipMode.Rotate) {
            const angle = (deltaX - deltaY) * 0.002;
            _axis.set(0, 0, -1).applyQuaternion(_quat0);
            _quat1.setFromAxisAngle(_axis, angle);
            _mat4.makeRotationFromQuaternion(_quat1);
        }
        else {
            const f = camera.size / this._viewport.height;
            _axis.set(deltaX * f, -deltaY * f, 0).applyQuaternion(_quat0);
            _mat4.identity().setPosition(_axis);
        }

        _mat4.multiply(object3D.matrix);
        this.activeModel.setFromMatrix(_mat4);

        return true;
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        this.activeModel = next && next.model;

        if (this.activeModel) {
            this.selection.selectComponent(this.activeModel);
        }
    }

    protected onPointer(event: IPointerEvent)
    {
        if (this.ins.mode.value === EPoseManipMode.Off || !this.activeModel) {
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
}