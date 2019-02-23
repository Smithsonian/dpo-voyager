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

import * as helpers from "@ff/three/helpers";

import { types, IComponentChangeEvent } from "@ff/graph/Component";

import CAssetManager from "@ff/scene/components/CAssetManager";
import CObject3D from "@ff/scene/components/CObject3D";

import { EUnitType, IModel, TUnitType, Vector3 } from "common/types/item";

import UberPBRMaterial, { EShaderMode } from "../shaders/UberPBRMaterial";
import Derivative, { EDerivativeQuality, EDerivativeUsage } from "../models/Derivative";
import DerivativeList from "../models/DerivativeList";

import CVLoaders from "./CVLoaders";
import NVItem from "../../explorer/nodes/NVItem";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _box = new THREE.Box3();

const _unitConversionFactor = {
    "mm": { "mm": 1, "cm": 0.1, "m": 0.001, "in": 0.0393701, "ft": 0.00328084, "yd": 0.00109361 },
    "cm": { "mm": 10, "cm": 1, "m": 0.01, "in": 0.393701, "ft": 0.0328084, "yd": 0.0109361 },
    "m": { "mm": 1000, "cm": 100, "m": 1, "in": 39.3701, "ft": 3.28084, "yd": 1.09361 },
    "in": { "mm": 25.4, "cm": 2.54, "m": 0.0254, "in": 1, "ft": 0.0833333, "yd": 0.0277778 },
    "ft": { "mm": 304.8, "cm": 30.48, "m": 0.3048, "in": 12, "ft": 1, "yd": 0.333334 },
    "yd": { "mm": 914.4, "cm": 91.44, "m": 0.9144, "in": 36, "ft": 3, "yd": 1 },
};

export { EShaderMode };

export interface IModelChangeEvent extends IComponentChangeEvent<CVModel>
{
    what: "derivative" | "boundingBox"
}

const _inputs = {
    units: types.Enum("Model.Units", EUnitType, EUnitType.cm),
    shader: types.Enum("Model.Shader", EShaderMode, EShaderMode.Default),
    quality: types.Enum("Model.Quality", EDerivativeQuality, EDerivativeQuality.High),
    autoLoad: types.Boolean("Model.AutoLoad", true),
    position: types.Vector3("Model.Position"),
    rotation: types.Vector3("Model.Rotation"),
    center: types.Event("Model.Center"),
    dumpDerivatives: types.Event("Derivatives.Dump"),
};

const _outputs = {
    globalUnits: types.Enum("GlobalUnits", EUnitType, EUnitType.cm),
    unitScale: types.Number("UnitScale", { preset: 1, precision: 5 }),
};

/**
 * Renderable component representing a Voyager explorer model.
 */
export default class CVModel extends CObject3D
{
    static readonly typeName: string = "CVModel";

    protected static readonly rotationOrder = "ZYX";

    ins = this.addInputs<CObject3D, typeof _inputs>(_inputs);
    outs = this.addOutputs<CObject3D, typeof _outputs>(_outputs);

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
        return this.system.getMainComponent(CVLoaders);
    }
    protected get item() {
        return this.node as NVItem;
    }

    private _marker: THREE.Mesh;

    create()
    {
        super.create();
        this.object3D = new THREE.Group();
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

        if (ins.units.changed) {
            this.updateUnitScale();
            this.emit<IModelChangeEvent>({ type: "change", what: "boundingBox", component: this });
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

    setGlobalUnits(units: EUnitType)
    {
        this.outs.globalUnits.setValue(units);
        this.updateUnitScale();
    }

    setFromMatrix(matrix: THREE.Matrix4)
    {
        const { position, rotation } = this.ins;

        matrix.decompose(_vec3a, _quat, _vec3b);
        _vec3a.multiplyScalar(1 / this.outs.unitScale.value).toArray(position.value);

        helpers.quaternionToDegrees(_quat, CVModel.rotationOrder, rotation.value);

        position.set();
        rotation.set();
    }

    deflate()
    {
        const data = this.toData();
        return data ? { data } : null;
    }

    inflate(json: any)
    {
        if (json.data) {
            this.fromData(json);
        }
    }

    toData()
    {
        const ins = this.ins;

        const data: IModel = {
            units: EUnitType[ins.units.value] as TUnitType,
            derivatives: this.derivatives.toData()
        };

        data.boundingBox = {
            min: this._boundingBox.min.toArray() as Vector3,
            max: this._boundingBox.max.toArray() as Vector3
        };

        const position = ins.position.value;
        if (position[0] !== 0 || position[1] !== 0 || position[2] !== 0) {
            data.translation = _vec3a.toArray();
        }

        const rotation = ins.rotation.value;
        if (rotation[0] !== 0 || rotation[1] !== 0 || rotation[2] !== 0) {
            helpers.degreesToQuaternion(rotation, CVModel.rotationOrder, _quat);
            data.rotation = _quat.toArray();
        }

        //if (this.material) {
        // TODO: Implement
        //}

        return data;
    }

    fromData(data: IModel)
    {
        const { units, position, rotation } = this.ins;

        units.setValue(EUnitType[data.units] || 0);

        if (data.derivatives) {
            this.derivatives.fromData(data.derivatives);
        }

        if (data.translation || data.rotation) {
            position.setValue(data.translation ? data.translation.slice() : [ 0, 0, 0 ]);

            if (data.rotation) {
                _quat.fromArray(data.rotation);
                rotation.setValue(helpers.quaternionToDegrees(_quat, CVModel.rotationOrder));
            }
            else {
                rotation.setValue([ 0, 0, 0 ]);
            }

            this.updateMatrixFromProps();
        }

        if (data.boundingBox) {
            this._boundingBox.min.fromArray(data.boundingBox.min);
            this._boundingBox.max.fromArray(data.boundingBox.max);

            this._boxFrame = new THREE["Box3Helper"](this._boundingBox, "#ffffff");
            this.addObject3D(this._boxFrame);

            this.emit<IModelChangeEvent>({ type: "change", what: "derivative", component: this });
        }

        //if (data.material) {
        // TODO: Implement
        //}

        // automatically display new derivatives if available
        this.ins.autoLoad.set();
    }

    inflateReferences()
    {
    }

    protected updateUnitScale()
    {
        const fromUnits = EUnitType[this.ins.units.getValidatedValue()];
        const toUnits = EUnitType[this.outs.globalUnits.value];
        this.outs.unitScale.setValue(_unitConversionFactor[fromUnits][toUnits]);

        //console.log("Model.updateUnitScale, from: %s, to: %s", fromUnits, toUnits);

        this.updateMatrixFromProps();
    }

    protected updateMatrixFromProps()
    {
        const ins = this.ins;
        const unitScale = this.outs.unitScale.value;

        _vec3a.fromArray(ins.position.value).multiplyScalar(unitScale);
        helpers.degreesToQuaternion(ins.rotation.value, CVModel.rotationOrder, _quat);
        _vec3b.setScalar(unitScale);

        const object3D = this.object3D;
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
        return derivative.load(this.loaders, this.item.urlPath)
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

            this.emit<IModelChangeEvent>({ type: "change", what: "derivative", component: this });

            // TODO: Test
            //const bb = derivative.boundingBox;
            //const box = { min: bb.min.toArray(), max: bb.max.toArray() };
            //console.log("derivative bounding box: ", box);
        });
    }

    // TODO: Test
    // protected onPointerUp(event: IPointerEvent)
    // {
    //     if (event.isDragging) {
    //         return;
    //     }
    //
    //     const position = event.view.pickPosition(event);
    //     const normal = event.view.pickNormal(event);
    //
    //     console.log("position", position);
    //     console.log("normal", normal);
    //
    //     const marker = this._marker;
    //     marker.position.copy(position);
    //     marker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    //     marker.updateMatrix();
    // }
}

