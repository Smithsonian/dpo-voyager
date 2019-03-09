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
import { IComponentEvent } from "@ff/graph/Node";

import Viewport from "@ff/three/Viewport";
import RenderQuadView, { EQuadViewLayout, IPointerEvent } from "@ff/scene/RenderQuadView";
import CRenderer from "@ff/scene/components/CRenderer";

import CVDocument from "../../explorer/components/CVDocument";
import NVItem from "../../explorer/nodes/NVItem";
import CVInterface from "../../explorer/components/CVInterface";
import CVModel from "../../core/components/CVModel";

import PoseTaskView from "../ui/PoseTaskView";
import CVTask from "./CVTask";

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


    protected get renderer() {
        return this.getMainComponent(CRenderer);
    }
    protected get activeModel() {
        const item = this.activeItem;
        return item ? item.model : null;
    }

    private _viewport: Viewport = null;
    private _deltaX = 0;
    private _deltaY = 0;


    createView()
    {
        return new PoseTaskView(this);
    }

    activateTask()
    {
        this.selectionController.selectedComponents.on(CVModel, this.onSelectModel, this);
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

        this.selectionController.selectedComponents.off(CVModel, this.onSelectModel, this);
        this.system.off<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);

        // switch back to single view layout
        this.renderer.views.forEach(view => {
            if (view instanceof RenderQuadView) {
                view.layout = EQuadViewLayout.Single;
            }
        });
    }

    create()
    {
        super.create();

        const configuration = this.configuration;
        configuration.gridVisible = true;
        configuration.annotationsVisible = false;
        configuration.interfaceVisible = false;
        configuration.bracketsVisible = true;
    }

    tick()
    {
        const mode = this.ins.mode.value;
        if (mode === EPoseManipMode.Off || !this.activeModel) {
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
            const f = camera.size / this._viewport.width;
            _axis.set(deltaX * f, -deltaY * f, 0).applyQuaternion(_quat0);
            _mat4.identity().setPosition(_axis);
        }

        _mat4.multiply(object3D.matrix);
        this.activeModel.setFromMatrix(_mat4);

        return true;
    }

    protected onActiveItem(previous: NVItem, next: NVItem)
    {
        if (next && next.hasComponent(CVModel)) {
            this.selectionController.selectComponent(next.model);
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

    protected onSelectModel(event: IComponentEvent<CVModel>)
    {
        const node = event.object.node;

        if (event.add && node instanceof NVItem) {
            this.itemManager.activeItem = node;
        }
    }
}