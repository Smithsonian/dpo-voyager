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

import { ITypedEvent, types } from "@ff/graph/Component";
import CObject3D from "@ff/scene/components/CObject3D";

import * as helpers from "@ff/three/helpers";

import { IDocument, INode } from "common/types/document";
import { IModel, EUnitType, TUnitType, EDerivativeUsage, EDerivativeQuality } from "common/types/model";

import unitScaleFactor from "../../core/utils/unitScaleFactor";
import UberPBRMaterial, { EShaderMode } from "../../core/shaders/UberPBRMaterial";

import Derivative from "../../core/models/Derivative";
import DerivativeList from "../../core/models/DerivativeList";

import CVAnnotationView from "./CVAnnotationView";
import CVAssetLoader from "./CVAssetLoader";
import { Vector3 } from "common/types/common";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _vec3c = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _box = new THREE.Box3();


/**
 * Graph component rendering a model or model part.
 *
 * ### Events
 * - *"bounding-box"* - emitted after the model's bounding box changed
 */
export default class CVModel2 extends CObject3D
{
    static readonly typeName: string = "CVModel2";

    static readonly rotationOrder = "ZYX";

    protected static readonly ins = {
        globalUnits: types.Enum("Model.GlobalUnits", EUnitType, EUnitType.cm),
        localUnits: types.Enum("Model.LocalUnits", EUnitType, EUnitType.cm),
        shader: types.Enum("Model.Shader", EShaderMode, EShaderMode.Default),
        quality: types.Enum("Model.Quality", EDerivativeQuality, EDerivativeQuality.High),
        autoLoad: types.Boolean("Model.AutoLoad", true),
        position: types.Vector3("Model.Position"),
        rotation: types.Vector3("Model.Rotation"),
        center: types.Event("Model.Center"),
        dumpDerivatives: types.Event("Derivatives.Dump"),
    };

    protected static readonly outs = {
        unitScale: types.Number("UnitScale", { preset: 1, precision: 5 }),
    };

    ins = this.addInputs<CObject3D, typeof CVModel2.ins>(CVModel2.ins);
    outs = this.addOutputs<CObject3D, typeof CVModel2.outs>(CVModel2.outs);


    private _derivatives = new DerivativeList();
    private _activeDerivative: Derivative = null;

    private _boundingBox = new THREE.Box3();
    private _boxFrame: THREE.Mesh = null;


    get derivatives() {
        return this._derivatives;
    }
    get boundingBox() {
        return this._boundingBox;
    }
    get activeDerivative() {
        return this._activeDerivative;
    }

    protected get loaders() {
        return this.system.getMainComponent(CVAssetLoader);
    }

    create()
    {
        super.create();
        this.object3D = new THREE.Group();

        const av = this.node.createComponent(CVAnnotationView);
        av.ins.unitScale.linkFrom(this.outs.unitScale);
    }

    update()
    {
        const ins = this.ins;

        if (!this.activeDerivative && ins.autoLoad.changed && ins.autoLoad.value) {
            this.autoLoad(ins.quality.value);
        }
        else if (ins.quality.changed) {
            const derivative = this.derivatives.select(EDerivativeUsage.Web3D, ins.quality.value);
            if (derivative && derivative !== this.activeDerivative) {
                this.loadDerivative(derivative)
                .catch(error => {
                    console.warn("Model.update - failed to load derivative");
                    console.warn(error);
                });
            }
        }


        if (ins.visible.changed) {
            this.object3D.visible = ins.visible.value;
        }

        if (ins.localUnits.changed || ins.globalUnits.changed) {
            this.updateUnitScale();
            this.emit("bounding-box");
        }
        if (ins.shader.changed) {
            const shader = ins.shader.getValidatedValue();
            this.object3D.traverse(object => {
                const material = object["material"] as UberPBRMaterial;
                if (material && material.isUberPBRMaterial) {
                    material.setShaderMode(shader);
                }
            });
        }
        if (ins.center.changed) {
            this.center();
        }
        if (ins.position.changed || ins.rotation.changed) {
            this.updateMatrixFromProps();
        }
        if (ins.dumpDerivatives.changed) {
            console.log(this.derivatives.toString(true));
        }

        return true;
    }

    dispose()
    {
        this.derivatives.clear();
        this._activeDerivative = null;

        super.dispose();
    }

    center()
    {
        const object3D = this.object3D;
        const position = this.ins.position;

        object3D.matrix.decompose(_vec3a, _quat, _vec3b);
        object3D.matrix.makeRotationFromQuaternion(_quat);
        _box.makeEmpty();
        helpers.computeLocalBoundingBox(object3D, _box, object3D.parent);
        _box.getCenter(_vec3a);
        _vec3a.multiplyScalar(-1).toArray(position.value);
        position.set();
    }

    setFromMatrix(matrix: THREE.Matrix4)
    {
        const { position, rotation } = this.ins;

        matrix.decompose(_vec3a, _quat, _vec3b);
        _vec3a.multiplyScalar(1 / this.outs.unitScale.value).toArray(position.value);

        helpers.quaternionToDegrees(_quat, CVModel2.rotationOrder, rotation.value);

        position.set();
        rotation.set();
    }

    fromDocument(document: IDocument, node: INode)
    {
        if (!isFinite(node.model)) {
            throw new Error("model property missing in node");
        }

        const data = document.models[node.model];

        if (data.translation || data.rotation) {
            const { position, rotation } = this.ins;

            position.setValue(data.translation ? data.translation.slice() : [0, 0, 0]);

            if (data.rotation) {
                _quat.fromArray(data.rotation);
                rotation.setValue(helpers.quaternionToDegrees(_quat, CVModel2.rotationOrder));
            } else {
                rotation.setValue([0, 0, 0]);
            }

            this.updateMatrixFromProps();
        }

        if (data.boundingBox) {
            this._boundingBox.min.fromArray(data.boundingBox.min);
            this._boundingBox.max.fromArray(data.boundingBox.max);

            this._boxFrame = new (THREE.Box3Helper as any)(this._boundingBox, "#ffffff");
            this.addObject3D(this._boxFrame);

            this.emit("bounding-box");
        }

        this.ins.localUnits.setValue(EUnitType[data.units || "cm"] || EUnitType.cm);

        if (data.derivatives) {
            this.derivatives.fromJSON(data.derivatives);
        }
        if (data.material) {
            // TODO: Implement
        }

        // automatically display new derivatives if available
        this.ins.autoLoad.set();
    }

    toDocument(document: IDocument, node: INode)
    {
        const data = {
            units: EUnitType[this.ins.localUnits.getValidatedValue()],
            derivatives: this.derivatives.toJSON(),
        } as IModel;

        data.boundingBox = {
            min: this._boundingBox.min.toArray() as Vector3,
            max: this._boundingBox.max.toArray() as Vector3
        };

        const ins = this.ins;
        const position = ins.position.value;
        if (position[0] !== 0 || position[1] !== 0 || position[2] !== 0) {
            data.translation = _vec3a.toArray();
        }

        const rotation = ins.rotation.value;
        if (rotation[0] !== 0 || rotation[1] !== 0 || rotation[2] !== 0) {
            helpers.degreesToQuaternion(rotation, CVModel2.rotationOrder, _quat);
            data.rotation = _quat.toArray();
        }

        const index = document.models.length;
        document.models.push(data);
        node.model = index;
    }

    protected updateUnitScale()
    {
        const ins = this.ins;
        const fromUnits = ins.localUnits.getValidatedValue();
        const toUnits = ins.globalUnits.getValidatedValue();
        this.outs.unitScale.setValue(unitScaleFactor(fromUnits, toUnits));

        //console.log("Model.updateUnitScale, from: %s, to: %s", fromUnits, toUnits);

        this.updateMatrixFromProps();
    }

    protected updateMatrixFromProps()
    {
        const ins = this.ins;
        const unitScale = this.outs.unitScale.value;
        const object3D = this.object3D;

        _vec3a.fromArray(ins.position.value).multiplyScalar(unitScale);
        helpers.degreesToQuaternion(ins.rotation.value, CVModel2.rotationOrder, _quat);
        _vec3b.setScalar(unitScale);
        object3D.matrix.compose(_vec3a, _quat, _vec3b);
        object3D.matrixWorldNeedsUpdate = true;
    }

    /**
     * Automatically loads derivatives up to the given quality.
     * First loads the lowest available quality (usually thumb), then
     * loads the desired quality level.
     * @param quality
     */
    protected autoLoad(quality: EDerivativeQuality): Promise<void>
    {
        const sequence = [];

        const lowestQualityDerivative = this.derivatives.select(EDerivativeUsage.Web3D, EDerivativeQuality.Thumb);
        if (lowestQualityDerivative) {
            sequence.push(lowestQualityDerivative);
        }

        const targetQualityDerivative = this.derivatives.select(EDerivativeUsage.Web3D, quality);
        if (targetQualityDerivative && targetQualityDerivative !== lowestQualityDerivative) {
            sequence.push(targetQualityDerivative);
        }

        if (sequence.length === 0) {
            return Promise.resolve();
        }

        // load sequence of derivatives one by one
        return sequence.reduce((promise, derivative) => {
            return promise.then(() => this.loadDerivative(derivative));
        }, Promise.resolve());
    }

    /**
     * Loads and displays the given derivative.
     * @param derivative
     */
    protected loadDerivative(derivative: Derivative): Promise<void>
    {
        return derivative.load(this.loaders)
        .then(() => {
            if (!derivative.model) {
                return;
            }

            if (this._boxFrame) {
                this.removeObject3D(this._boxFrame);
                this._boxFrame.geometry.dispose();
            }
            if (this._activeDerivative) {
                this.removeObject3D(this._activeDerivative.model);
                this._activeDerivative.dispose();
            }

            helpers.computeLocalBoundingBox(derivative.model, this._boundingBox);

            this._activeDerivative = derivative;
            this.addObject3D(derivative.model);

            this.emit("bounding-box");

            // TODO: Test
            //const bb = derivative.boundingBox;
            //const box = { min: bb.min.toArray(), max: bb.max.toArray() };
            //console.log("derivative bounding box: ", box);
        });
    }
}