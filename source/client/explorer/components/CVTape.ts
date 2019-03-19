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

import { ITape } from "common/types/explorer";

import Pin from "../../core/utils/Pin";
import CVModel_old from "../../core/components/CVModel_old";

////////////////////////////////////////////////////////////////////////////////

const _mat3 = new THREE.Matrix3();
const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _vec3up = new THREE.Vector3(0, 1, 0);

export enum ETapeState { SetStart, SetEnd }

export default class CVTape extends CObject3D
{
    static readonly typeName: string = "CVTape";

    protected static readonly tapeIns = {
        startPosition: types.Vector3("Start.Position"),
        startDirection: types.Vector3("Start.Direction"),
        endPosition: types.Vector3("End.Position"),
        endDirection: types.Vector3("End.Direction"),
    };

    protected static readonly tapeOuts = {
        state: types.Enum("Tape.State", ETapeState),
        distance: types.Number("Tape.Distance"),
    };

    ins = this.addInputs<CObject3D, typeof CVTape.tapeIns>(CVTape.tapeIns);
    outs = this.addOutputs<CObject3D, typeof CVTape.tapeOuts>(CVTape.tapeOuts);

    protected startPin: Pin = null;
    protected endPin: Pin = null;
    protected line: THREE.Line = null;

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
        const lineGeometry = this.line.geometry as THREE.Geometry;

        // if tape is visible, listen for pointer events to set tape start/end
        if (ins.visible.changed) {
            if (ins.visible.value) {
                this.system.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
            }
            else {
                this.system.off<IPointerEvent>("pointer-up", this.onPointerUp, this);
            }
        }

        // update tape start point
        if (ins.startPosition.changed || ins.startDirection.changed) {
            const startPin = this.startPin;
            startPin.position.fromArray(ins.startPosition.value);
            _vec3a.fromArray(ins.startDirection.value);
            startPin.quaternion.setFromUnitVectors(_vec3up, _vec3a);
            startPin.updateMatrix();

            lineGeometry.vertices[0].copy(startPin.position);
            lineGeometry.verticesNeedUpdate = true;
        }

        // update tape end point
        if (ins.endPosition.changed || ins.endDirection.changed) {
            const endPin = this.endPin;
            endPin.position.fromArray(ins.endPosition.value);
            _vec3a.fromArray(ins.endDirection.value);
            endPin.quaternion.setFromUnitVectors(_vec3up, _vec3a);
            endPin.updateMatrix();

            lineGeometry.vertices[1].copy(endPin.position);
            lineGeometry.verticesNeedUpdate = true;
        }

        // update distance between measured points
        _vec3a.fromArray(ins.startPosition.value);
        _vec3b.fromArray(ins.endPosition.value);
        this.outs.distance.setValue(_vec3a.distanceTo(_vec3b));

        return true;
    }

    fromData(data: ITape)
    {
        this.ins.copyValues({
            visible: data.enabled,
            startPosition: data.startPosition,
            startDirection: data.startDirection,
            endPosition: data.endPosition,
            endDirection: data.endDirection
        });
    }

    toData(): ITape
    {
        const ins = this.ins;

        return {
            enabled: ins.visible.cloneValue(),
            startPosition: ins.startPosition.cloneValue(),
            startDirection: ins.startDirection.cloneValue(),
            endPosition: ins.endPosition.cloneValue(),
            endDirection: ins.endDirection.cloneValue()
        };
    }

    protected onPointerUp(event: IPointerEvent)
    {
        if (event.isDragging || !event.component || !event.component.is(CVModel_old)) {
            return;
        }

        // get click position and normal
        const model = event.component as CVModel_old;
        const worldMatrix = model.object3D.matrixWorld;
        _mat3.getNormalMatrix(worldMatrix);

        const position = event.view.pickPosition(event).applyMatrix4(worldMatrix);
        const normal = event.view.pickNormal(event).applyMatrix3(_mat3).normalize();

        // update pins and measurement line
        const { startPin, endPin, line, ins, outs } = this;

        if (outs.state.value === ETapeState.SetStart) {
            position.toArray(ins.startPosition.value);
            normal.toArray(ins.startDirection.value);
            ins.startPosition.set();
            ins.startDirection.set();

            startPin.visible = true;
            endPin.visible = false;
            line.visible = false;

            outs.state.setValue(ETapeState.SetEnd);
        }
        else {
            position.toArray(ins.endPosition.value);
            normal.toArray(ins.endDirection.value);
            ins.endPosition.set();
            ins.endDirection.set();

            // set end position of tape
            startPin.visible = true;
            endPin.visible = true;
            line.visible = true;

            outs.state.setValue(ETapeState.SetStart);
        }
    }
}