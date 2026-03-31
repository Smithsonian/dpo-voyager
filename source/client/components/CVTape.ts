/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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

import { Matrix3, Vector3, Box3, Line, Group, BufferGeometry, LineBasicMaterial, BufferAttribute, Material } from "three";

import CObject3D, { Node, types, IPointerEvent } from "@ff/scene/components/CObject3D";

import { ITape, TMarkerStyle } from "client/schema/setup";

import { MeasurementMarker, EMarkerStyle, createMarker, getMarkerStyleValue } from "../utils/MeasurementMarker";
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
        markerStyle: types.Enum("Tape.MarkerStyle", EMarkerStyle, EMarkerStyle.Sphere),
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

    protected startMarker: MeasurementMarker = null;
    protected endMarker: MeasurementMarker = null;
    protected line: Line = null;
    protected annotationView: CVStaticAnnotationView = null;
    protected label: Annotation = null;

    constructor(node: Node, id: string)
    {
        super(node, id);

        this.object3D = new Group();
        this.object3D.name = "Tape";

        this.startMarker = createMarker(EMarkerStyle.Sphere);
        this.startMarker.matrixAutoUpdate = false;
        this.startMarker.visible = false;

        this.endMarker = createMarker(EMarkerStyle.Sphere);
        this.endMarker.matrixAutoUpdate = false;
        this.endMarker.visible = false;

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

        this.object3D.add(this.startMarker, this.endMarker, this.line);
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
        this.object3D.remove(this.startMarker, this.endMarker, this.line);

        this.startMarker.dispose();
        this.endMarker.dispose();
        this.line.geometry.dispose();
        (this.line.material as Material).dispose();
        this.label.dispose();

        this.startMarker = null;
        this.endMarker = null;
        this.line = null;
        this.label = null;

        super.dispose();
    }

    update(context)
    {
        const lineGeometry = this.line.geometry as BufferGeometry;
        const { startMarker, endMarker, line, ins } = this;

        if (ins.enabled.changed) {
            ins.visible.setValue(ins.enabled.value);
        }

        super.update(context);

        // handle marker style change
        if (ins.markerStyle.changed) {
            this.recreateMarkers();
        }

        // determine marker scale based on scene/model bounding box
        if (ins.boundingBox.changed && ins.boundingBox.value) {
            ins.boundingBox.value.getSize(_vec3a);
            const radius = _vec3a.length() * 0.5;

            this.startMarker.scale.setScalar(radius * 0.003);
            this.startMarker.updateMatrix();

            this.endMarker.scale.setScalar(radius * 0.003);
            this.endMarker.updateMatrix();

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
                    startMarker.visible = true;
                    endMarker.visible = true;
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
            startMarker.position.fromArray(ins.startPosition.value);
            _vec3a.fromArray(ins.startDirection.value);
            startMarker.quaternion.setFromUnitVectors(_vec3up, _vec3a);
            startMarker.updateMatrix();

            const positions = (lineGeometry.attributes.position as BufferAttribute).array as Float64Array;//Array<number>;
            positions[0] = startMarker.position.x;
            positions[1] = startMarker.position.y;
            positions[2] = startMarker.position.z;
            lineGeometry.attributes.position.needsUpdate = true;
            this.annotationView.ins.visible.setValue(false);
        }

        // update tape end point
        if (ins.endPosition.changed || ins.endDirection.changed) {
            endMarker.position.fromArray(ins.endPosition.value);
            _vec3a.fromArray(ins.endDirection.value);
            endMarker.quaternion.setFromUnitVectors(_vec3up, _vec3a);
            endMarker.updateMatrix();

            const positions = (lineGeometry.attributes.position as BufferAttribute).array as Float64Array;//Array<number>;
            positions[3] = endMarker.position.x;
            positions[4] = endMarker.position.y;
            positions[5] = endMarker.position.z;
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
            startPosition: data.startPosition || [ 0, 0, 0 ],
            startDirection: data.startDirection || [ 1, 0, 0 ],
            endPosition: data.endPosition || [ 0, 0, 0 ],
            endDirection: data.endDirection || [ 1, 0, 0 ]
        });
        this.ins.enabled.copyValue(false);  // enable not set from data

        if (data.markerStyle) {
            const styleIndex = ["Sphere", "Ring", "Crosshair", "Disc", "Pin"].indexOf(data.markerStyle);
            if (styleIndex >= 0) {
                this.ins.markerStyle.setValue(styleIndex);
            }
        }
    }

    toData(): ITape
    {
        const ins = this.ins;

        return {
            enabled: ins.visible.cloneValue(),/*
            markerStyle: ins.markerStyle.cloneValue(),
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

        // update markers and measurement line
        const { startMarker, endMarker, line, ins, outs } = this;

        if (outs.state.value === ETapeState.SetStart) {
            position.toArray(ins.startPosition.value);
            normal.toArray(ins.startDirection.value);
            ins.startPosition.set();
            ins.startDirection.set();

            startMarker.visible = true;
            endMarker.visible = false;
            line.visible = false;

            outs.state.setValue(ETapeState.SetEnd);
        }
        else {
            position.toArray(ins.endPosition.value);
            normal.toArray(ins.endDirection.value);
            ins.endPosition.set();
            ins.endDirection.set();

            // set end position of tape
            startMarker.visible = true;
            endMarker.visible = true;
            line.visible = true;

            outs.state.setValue(ETapeState.SetStart);
        }
    }

    protected recreateMarkers()
    {
        const { ins } = this;
        const style = ins.markerStyle.getValidatedValue();

        // Store current state
        const startVisible = this.startMarker.visible;
        const endVisible = this.endMarker.visible;
        const startPosition = this.startMarker.position.clone();
        const endPosition = this.endMarker.position.clone();
        const startQuaternion = this.startMarker.quaternion.clone();
        const endQuaternion = this.endMarker.quaternion.clone();
        const startScale = this.startMarker.scale.clone();
        const endScale = this.endMarker.scale.clone();

        // Remove and dispose old markers
        this.object3D.remove(this.startMarker, this.endMarker);
        this.startMarker.dispose();
        this.endMarker.dispose();

        // Create new markers with the selected style
        this.startMarker = createMarker(style);
        this.startMarker.matrixAutoUpdate = false;
        this.endMarker = createMarker(style);
        this.endMarker.matrixAutoUpdate = false;

        // Restore state
        this.startMarker.visible = startVisible;
        this.endMarker.visible = endVisible;
        this.startMarker.position.copy(startPosition);
        this.endMarker.position.copy(endPosition);
        this.startMarker.quaternion.copy(startQuaternion);
        this.endMarker.quaternion.copy(endQuaternion);
        this.startMarker.scale.copy(startScale);
        this.endMarker.scale.copy(endScale);
        this.startMarker.updateMatrix();
        this.endMarker.updateMatrix();

        // Add new markers to scene
        this.object3D.add(this.startMarker, this.endMarker);
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