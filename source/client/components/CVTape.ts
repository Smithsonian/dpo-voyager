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

import { Matrix3, Vector3, Box3, Line, Group, BufferGeometry, LineBasicMaterial, Box3Helper, BufferAttribute } from "three";

import CObject3D, { Node, types, IPointerEvent } from "@ff/scene/components/CObject3D";

import { ITape } from "client/schema/setup";

import Pin from "../utils/Pin";
import CVModel2 from "./CVModel2";
import CVScene from "client/components/CVScene";
import { EUnitType } from "client/schema/common";
import unitScaleFactor from "client/utils/unitScaleFactor";
import { getMeshTransform } from "client/utils/Helpers";
import Annotation from "../models/Annotation";
import CVStaticAnnotationView from "./CVStaticAnnotationView";

////////////////////////////////////////////////////////////////////////////////

const _mat3 = new Matrix3();
const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _vec3up = new Vector3(0, 1, 0);

export enum ETapeState { SetStart, SetEnd }

export default class CVTape extends CObject3D
{
    static readonly typeName: string = "CVTape";

    static readonly text: string = "Tape";
    static readonly icon: string = "";

    protected static readonly tapeIns = {
        startPosition: types.Vector3("Start.Position"),
        startDirection: types.Vector3("Start.Direction"),
        endPosition: types.Vector3("End.Position"),
        endDirection: types.Vector3("End.Direction"),
        boundingBox: types.Object("Scene.BoundingBox", Box3),
        globalUnits: types.Enum("Model.GlobalUnits", EUnitType, EUnitType.cm),
        localUnits: types.Enum("Model.LocalUnits", EUnitType, EUnitType.cm),
        enabled: types.Boolean("Tape.Enabled", false),
    };

    protected static readonly tapeOuts = {
        state: types.Enum("Tape.State", ETapeState),
        distance: types.Number("Tape.Distance"),
        unitScale: types.Number("UnitScale", { preset: 1, precision: 5 })
    };

    ins = this.addInputs<CObject3D, typeof CVTape.tapeIns>(CVTape.tapeIns);
    outs = this.addOutputs<CObject3D, typeof CVTape.tapeOuts>(CVTape.tapeOuts);

    get settingProperties() {
        return [
            this.ins.visible,
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.visible,
            this.ins.startPosition,
            this.ins.startDirection,
            this.ins.endPosition,
            this.ins.endDirection,
        ];
    }

    protected startPin: Pin = null;
    protected endPin: Pin = null;
    protected line: Line = null;
    protected annotationView: CVStaticAnnotationView = null;
    protected label: Annotation = null;

    constructor(node: Node, id: string)
    {
        super(node, id);

        this.object3D = new Group();

        this.startPin = new Pin();
        this.startPin.matrixAutoUpdate = false;
        this.startPin.visible = false;

        this.endPin = new Pin();
        this.endPin.matrixAutoUpdate = false;
        this.endPin.visible = false;

        const points = [];
        points.push(new Vector3(0, 0, 0));
        points.push(new Vector3(0, 0, 0));

        const lineGeometry = new BufferGeometry().setFromPoints(points);
        const lineMaterial = new LineBasicMaterial();
        lineMaterial.depthTest = false;
        lineMaterial.transparent = true;
        this.line = new Line(lineGeometry, lineMaterial);
        this.line.visible = false;
        this.line.frustumCulled = false;

        // add distance label
        this.annotationView = this.node.createComponent(CVStaticAnnotationView);
        const annotation = this.label = new Annotation(undefined);
        annotation.data.style = "Standard";
        annotation.data.position = [0,0,0];
        annotation.data.direction = [0,0,0]
        this.annotationView.ins.visible.setValue(false);
        this.annotationView.addAnnotation(annotation);

        this.object3D.add(this.startPin, this.endPin, this.line);
    }

    create()
    {
        super.create();

        const scene = this.getGraphComponent(CVScene);
        this.ins.boundingBox.linkFrom(scene.outs.boundingBox);
        this.ins.globalUnits.linkFrom(scene.ins.units);
    }

    dispose()
    {
        this.startPin = null;
        this.endPin = null;
        this.line = null;

        super.dispose();
    }

    update(context)
    {
        const lineGeometry = this.line.geometry as BufferGeometry;
        const { startPin, endPin, line, ins } = this;

        if (ins.enabled.changed) {
            ins.visible.setValue(ins.enabled.value);
        }

        super.update(context);

        // determine pin scale based on scene/model bounding box
        if (ins.boundingBox.changed && ins.boundingBox.value) {
            ins.boundingBox.value.getSize(_vec3a);
            const radius = _vec3a.length() * 0.5;

            startPin.scale.setScalar(radius * 0.003);
            startPin.updateMatrix();

            endPin.scale.setScalar(radius * 0.003);
            endPin.updateMatrix();

            const defaultScale = radius * 0.05;
            this.annotationView.ins.unitScale.setValue(defaultScale);
            ins.endPosition.set(); // always trigger recalculation
        }

        // if tape is enabled, listen for pointer events to set tape start/end
        if (ins.enabled.changed) {
            if (ins.enabled.value) {
                this.system.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
                this.annotationView.ins.visible.setValue(this.outs.distance.value > 0);
            }
            else {
                this.system.off<IPointerEvent>("pointer-up", this.onPointerUp, this);
                this.annotationView.ins.visible.setValue(false);
            }
        }

        if(ins.visible.changed) {
            if(ins.visible.value) {
                const startPos = ins.startPosition.value;
                const endPos = ins.endPosition.value;
                if(startPos[0] != endPos[0] || startPos[1] != endPos[1] || startPos[2] != endPos[2]) {
                    startPin.visible = true;
                    endPin.visible = true;
                    line.visible = true;
                    this.annotationView.ins.visible.setValue(true);
                }
            }
            else {
                this.annotationView.ins.visible.setValue(false);
            }
        }

        if (ins.globalUnits.changed) {
            this.updateUnitScale();
        }

        // update tape start point
        if (ins.startPosition.changed || ins.startDirection.changed) {
            startPin.position.fromArray(ins.startPosition.value);
            _vec3a.fromArray(ins.startDirection.value);
            startPin.quaternion.setFromUnitVectors(_vec3up, _vec3a);
            startPin.updateMatrix();

            const positions = (lineGeometry.attributes.position as BufferAttribute).array as Float64Array;//Array<number>;
            positions[0] = startPin.position.x;
            positions[1] = startPin.position.y;
            positions[2] = startPin.position.z;
            lineGeometry.attributes.position.needsUpdate = true;
            this.annotationView.ins.visible.setValue(false);
        }

        // update tape end point
        if (ins.endPosition.changed || ins.endDirection.changed) {
            endPin.position.fromArray(ins.endPosition.value);
            _vec3a.fromArray(ins.endDirection.value);
            endPin.quaternion.setFromUnitVectors(_vec3up, _vec3a);
            endPin.updateMatrix();

            const positions = (lineGeometry.attributes.position as BufferAttribute).array as Float64Array;//Array<number>;
            positions[3] = endPin.position.x;
            positions[4] = endPin.position.y;
            positions[5] = endPin.position.z;
            lineGeometry.attributes.position.needsUpdate = true;

            // update distance between measured points
            _vec3a.fromArray(ins.startPosition.value);
            _vec3b.fromArray(ins.endPosition.value);
            const tapeLength = _vec3a.distanceTo(_vec3b);
            this.outs.distance.setValue(tapeLength);

            // update distance label
            const data = this.label.data;
            const scaleFactor = 1/this.annotationView.ins.unitScale.value;
            data.position = [scaleFactor*(positions[0]+positions[3])/2.0,scaleFactor*(positions[1]+positions[4])/2.0,scaleFactor*(positions[2]+positions[5])/2.0];
            const units = this.ins.globalUnits.getOptionText();
            this.label.title = tapeLength.toFixed(2) + " " + units;
            this.annotationView.updateAnnotation(this.label, true);
            if(tapeLength > 0 && this.ins.visible.value) {
                this.annotationView.ins.visible.setValue(true);
            }
        }

        return true;
    }

    fromData(data: ITape)
    {
        this.ins.copyValues({
            visible: data.enabled,   // TODO: should probably be visible instead of enabled
            /*startPosition: data.startPosition,
            startDirection: data.startDirection,
            endPosition: data.endPosition,
            endDirection: data.endDirection*/
        });
    }

    toData(): ITape
    {
        const ins = this.ins;

        return {
            enabled: ins.visible.cloneValue()/*,
            startPosition: ins.startPosition.cloneValue(),
            startDirection: ins.startDirection.cloneValue(),
            endPosition: ins.endPosition.cloneValue(),
            endDirection: ins.endDirection.cloneValue()*/
        };
    }

    protected onPointerUp(event: IPointerEvent)
    {
        if (event.isDragging || !event.component || !event.component.is(CVModel2)) {
            return;
        }

        // Compensate for any internal transforms the loaded geometry may have
        const model = event.component as CVModel2;
        const meshTransform = getMeshTransform(model.object3D, event.object3D);
        const bounds = model.localBoundingBox.clone().applyMatrix4(meshTransform);

        // get click position and normal
        const worldMatrix = event.object3D.matrixWorld;
        _mat3.getNormalMatrix(worldMatrix);

        const position = event.view.pickPosition(event, bounds).applyMatrix4(worldMatrix); 
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

    protected updateUnitScale()
    {
        const ins = this.ins;
        const fromUnits = ins.localUnits.getValidatedValue();
        const toUnits = ins.globalUnits.getValidatedValue();
        this.outs.unitScale.setValue(unitScaleFactor(fromUnits, toUnits));

        _vec3a.fromArray(ins.startPosition.value);
        ins.startPosition.setValue(_vec3a.multiplyScalar(this.outs.unitScale.value).toArray());
        _vec3a.fromArray(ins.endPosition.value);
        ins.endPosition.setValue(_vec3a.multiplyScalar(this.outs.unitScale.value).toArray());

        ins.localUnits.setValue(toUnits);
    }
}