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

import { Vector3, Matrix4, Quaternion, Box3 } from "three";

import { Node, types } from "@ff/graph/Component";

import Viewport from "@ff/three/Viewport";

import RenderQuadView, { EQuadViewLayout, IPointerEvent } from "@ff/scene/RenderQuadView";
import CRenderer from "@ff/scene/components/CRenderer";

import NVNode from "../nodes/NVNode";

import CVModel2 from "./CVModel2";
import CVTask from "./CVTask";

import PoseTaskView from "../ui/story/PoseTaskView";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new Vector3();
const _axis = new Vector3();
const _mat4 = new Matrix4();
const _quat0 = new Quaternion();
const _quat1 = new Quaternion();
const _boundingBox = new Box3();
const _size = new Vector3();

export enum EPoseManipMode { Off, Translate, Rotate }

/**
 * Provides tools for editing the pose of a model or part.
 * Corresponding view: [[PoseTaskView]].
 *
 * Listens to viewport pointer events to provide interactive move and rotate tools.
 */
export default class CVPoseTask extends CVTask
{
    static readonly typeName: string = "CVPoseTask";

    static readonly text: string = "Pose";
    static readonly icon: string = "move";

    protected static readonly ins = {
        mode: types.Enum("Pose.Mode", EPoseManipMode, EPoseManipMode.Off),
        modelUpdated: types.Event("Model.Updated"),
    };
    protected static readonly outs = {
        size: types.Vector3("Model.Size")
    };

    ins = this.addInputs<CVTask, typeof CVPoseTask.ins>(CVPoseTask.ins);
    outs = this.addOutputs<CVTask, typeof CVPoseTask.outs>(CVPoseTask.outs);

    private _viewport: Viewport = null;
    private _deltaX = 0;
    private _deltaY = 0;
    private _90degLock = false;
    private _accumulatedAngle = 0;

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
        // start listening to pointer events for interactive move/rotate tools
        this.system.on<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);

        // switch to quad view layout
        this.renderer.views.forEach(view => {
            if (view instanceof RenderQuadView) {
                view.layout = EQuadViewLayout.Quad;
                view.viewports.forEach(viewport => {
                    if(viewport.camera) {
                        viewport.camera.layers.enable(1);
                    }
                });
            }
        });

        // start observing active node and active document changes
        this.startObserving();

        const setup = this.activeDocument.setup;
        setup.reader.ins.enabled.setValue(false);   // disable reader
        setup.navigation.ins.zoomExtents.set();     // zoom all viewports
        setup.grid.ins.labelEnabled.setValue(false);// disable grid label

        super.activateTask();
    }

    deactivateTask()
    {
        const setup = this.activeDocument.setup;
        setup.grid.ins.labelEnabled.setValue(true);// enable grid label

        super.deactivateTask();

        // stop observing active node and active document changes
        this.stopObserving();

        // switch back to single view layout
        this.renderer.views.forEach(view => {
            if (view instanceof RenderQuadView) {
                view.layout = EQuadViewLayout.Single;
            }
        });

        // stop listening to pointer events for interactive move/rotate tools
        this.system.off<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
    }

    update(context)
    {
        if (this.ins.modelUpdated && this.activeModel) {
            _boundingBox.makeEmpty();
            _boundingBox.expandByObject(this.activeModel.object3D);
            _boundingBox.getSize(_size);
            _size.toArray(this.outs.size.value);
            this.outs.size.set();

            if (ENV_DEVELOPMENT) {
                console.log("CVPoseTask.update - model updated");
            }
        }

        // mode property has changed
        return true;
    }

    tick()
    {
        if (!this.isActiveTask) {
            return false;
        }

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

        const camera = this._viewport.camera;

        if (!camera || !camera.isOrthographicCamera) {
            return false;
        }

        camera.matrixWorld.decompose(_vec3a, _quat0, _vec3a);

        if (mode === EPoseManipMode.Rotate) {
            // convert accumulated pointer movement to rotation angle
            let angle = (deltaX - deltaY) * 0.002;

            if(this._90degLock) {
                this._accumulatedAngle += angle*2;
                let result = Math.abs(this._accumulatedAngle) + (Math.PI/4.0);
                result -= result % (Math.PI/2.0);

                if(result != 0) {
                    angle = this._accumulatedAngle > 0 ? result : -result;
                    this._accumulatedAngle = 0;
                }
                else {
                    return;
                }
            }

            // generate rotation matrix
            _axis.set(0, 0, -1).applyQuaternion(_quat0);
            _quat1.setFromAxisAngle(_axis, angle);
            _mat4.makeRotationFromQuaternion(_quat1);
        }
        else {
            // transform pointer movement to world scale, generate translation matrix
            const f = camera.size / this._viewport.height;
            _axis.set(deltaX * f, -deltaY * f, 0).applyQuaternion(_quat0);
            _mat4.identity().setPosition(_axis);
        }

        // multiply delta transform with current model pose transform
        _mat4.multiply(this.activeModel.object3D.matrix);
        this.activeModel.setFromMatrix(_mat4);

        return true;
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        if (this.activeModel) {
            this.ins.modelUpdated.unlinkFrom(this.activeModel.outs.updated);
        }

        this.activeModel = next && next.model;

        if (this.activeModel) {
            this.ins.modelUpdated.linkFrom(this.activeModel.outs.updated);
            this.ins.modelUpdated.set();

            this.selection.selectComponent(this.activeModel);
        }
    }

    protected onPointer(event: IPointerEvent)
    {
        if (this.ins.mode.value === EPoseManipMode.Off || !this.activeModel) {
            return;
        }

        // check pointer events if left button is down
        if (event.originalEvent.buttons === 1) {

            if (event.type === "pointer-move") {
                // modify speed multiplier according to modifier keys pressed (ctrl = 0.1, shift = 10)
                const speed = event.ctrlKey ? 0.1 : (event.shiftKey ? 10 : 1);

                this._90degLock = event.altKey ? true : false;

                // accumulate motion in deltaX/deltaY
                this._deltaX += event.movementX * speed;
                this._deltaY += event.movementY * speed;
                this._viewport = event.viewport;

                // mark event as handled
                event.stopPropagation = true;
            }
        }
    }
}