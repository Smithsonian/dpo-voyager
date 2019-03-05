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

import CObject3D, { IPointerEvent, types } from "@ff/scene/components/CObject3D";

import { ITapeTool } from "common/types/features";

import Pin from "../../core/utils/Pin";
import CVModel from "../../core/components/CVModel";

////////////////////////////////////////////////////////////////////////////////

const _mat3 = new THREE.Matrix3();
const _vec3up = new THREE.Vector3(0, 1, 0);


export default class CVTape extends CObject3D
{
    static readonly typeName: string = "CVTape";

    protected static readonly tapeIns = {
        active: types.Boolean("Tape.Active"),
        startPosition: types.Vector3("Start.Position"),
        startDirection: types.Vector3("Start.Direction"),
        endPosition: types.Vector3("End.Position"),
        endDirection: types.Vector3("End.Direction"),
    };

    protected static readonly tapeOuts = {
        complete: types.Boolean("Measurement.Complete"),
        distance: types.Number("Measurement.Distance"),
    };

    ins = this.addInputs<CObject3D, typeof CVTape.tapeIns>(CVTape.tapeIns);
    outs = this.addOutputs<CObject3D, typeof CVTape.tapeOuts>(CVTape.tapeOuts);

    protected startPin: Pin = null;
    protected endPin: Pin = null;
    protected line: THREE.Line = null;

    protected startPosition = new THREE.Vector3();
    protected endPosition = new THREE.Vector3();

    create()
    {
        this.object3D = new THREE.Group();

        this.startPin = new Pin();
        this.startPin.visible = false;

        this.endPin = new Pin();
        this.endPin.visible = false;

        const lineGeometry = new THREE.Geometry();
        lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));
        const lineMaterial = new THREE.LineBasicMaterial();
        lineMaterial.depthTest = false;
        lineMaterial.transparent = true;
        this.line = new THREE.Line(lineGeometry, lineMaterial);
        this.line.visible = false;

        this.object3D.add(this.startPin, this.endPin, this.line);
    }

    update(context)
    {
        super.update(context);

        const ins = this.ins;

        if (ins.visible.changed) {
            if (ins.visible.value) {
                this.system.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
            }
            else {
                this.system.off<IPointerEvent>("pointer-up", this.onPointerUp, this);
            }
        }

        return true;
    }

    fromData(data: ITapeTool)
    {
        this.ins.copyValues({
            visible: data.active,
            startPosition: data.startPosition,
            startDirection: data.startDirection,
            endPosition: data.endPosition,
            endDirection: data.endDirection
        });
    }

    toData(): ITapeTool
    {
        const ins = this.ins;

        return {
            active: ins.visible.cloneValue(),
            startPosition: ins.startPosition.cloneValue(),
            startDirection: ins.startDirection.cloneValue(),
            endPosition: ins.endPosition.cloneValue(),
            endDirection: ins.endDirection.cloneValue()
        };
    }

    protected onPointerUp(event: IPointerEvent)
    {
        if (event.isDragging || !event.component || !event.component.is(CVModel)) {
            return;
        }

        // get click position and normal
        const model = event.component as CVModel;
        const worldMatrix = model.object3D.matrixWorld;
        _mat3.getNormalMatrix(worldMatrix);

        const position = event.view.pickPosition(event).applyMatrix4(worldMatrix);
        const normal = event.view.pickNormal(event).applyMatrix3(_mat3).normalize();

        // update pins and measurement line
        const { startPin, endPin, line, outs } = this;
        const lineGeometry = line.geometry as THREE.Geometry;

        if (!startPin.visible || endPin.visible) {
            // set start position of tape
            startPin.visible = true;
            endPin.visible = false;
            startPin.position.copy(position);
            startPin.quaternion.setFromUnitVectors(_vec3up, normal);
            startPin.updateMatrix();

            line.visible = false;
            lineGeometry.vertices[0].copy(position);

            this.startPosition.copy(position);
            outs.complete.setValue(false);
            outs.distance.setValue(0);
        }
        else {
            // set end position of tape
            endPin.visible = true;
            endPin.position.copy(position);
            endPin.quaternion.setFromUnitVectors(_vec3up, normal);
            endPin.updateMatrix();

            line.visible = true;
            lineGeometry.vertices[1].copy(position);
            lineGeometry.verticesNeedUpdate = true;

            // calculate measured distance
            this.endPosition.copy(position);
            const distance = this.startPosition.distanceTo(this.endPosition);
            outs.complete.setValue(true);
            outs.distance.setValue(distance);
        }
    }
}