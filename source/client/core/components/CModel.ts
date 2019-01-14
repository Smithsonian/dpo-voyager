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

import math from "@ff/core/math";
import threeMath from "@ff/three/math";

import { types } from "@ff/graph/propertyTypes";
import { IComponentChangeEvent } from "@ff/graph/Component";
import { computeLocalBoundingBox } from "@ff/three/helpers";
import { CObject3D } from "@ff/scene/components";

import { EUnitType, IModel, TUnitType, Vector3 } from "common/types/item";

import UberPBRMaterial, { EShaderMode } from "../shaders/UberPBRMaterial";
import Derivative, { EDerivativeQuality, EDerivativeUsage } from "../models/Derivative";
import { EAssetType, EMapType } from "../models/Asset";

import CLoadingManager from "./CLoadingManager";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _mat4 = new THREE.Matrix4();
const _box = new THREE.Box3();

const _qualityLevels = [
    EDerivativeQuality.Thumb,
    EDerivativeQuality.Low,
    EDerivativeQuality.Medium,
    EDerivativeQuality.High,
    EDerivativeQuality.Highest
];

const _unitConversionFactor = {
    "mm": { "mm": 1, "cm": 0.1, "m": 0.001, "in": 0.0393701, "ft": 0.00328084, "yd": 0.00109361 },
    "cm": { "mm": 10, "cm": 1, "m": 0.01, "in": 0.393701, "ft": 0.0328084, "yd": 0.0109361 },
    "m": { "mm": 1000, "cm": 100, "m": 1, "in": 39.3701, "ft": 3.28084, "yd": 1.09361 },
    "in": { "mm": 25.4, "cm": 2.54, "m": 0.0254, "in": 1, "ft": 0.0833333, "yd": 0.0277778 },
    "ft": { "mm": 304.8, "cm": 30.48, "m": 0.3048, "in": 12, "ft": 1, "yd": 0.333334 },
    "yd": { "mm": 914.4, "cm": 91.44, "m": 0.9144, "in": 36, "ft": 3, "yd": 1 },
};

export { EShaderMode };

export interface IModelChangeEvent extends IComponentChangeEvent<CModel>
{
    what: "derivative" | "boundingBox"
}

const ins = {
    visible: types.Boolean("Visible", true),
    units: types.Enum("Units", EUnitType, EUnitType.cm),
    quality: types.Enum("Quality", EDerivativeQuality, EDerivativeQuality.High),
    autoLoad: types.Boolean("Auto.Load", true),
    position: types.Vector3("Pose.Position"),
    rotation: types.Vector3("Pose.Rotation"),
    center: types.Event("Pose.Center")
};

const outs = {
    globalUnits: types.Enum("GlobalUnits", EUnitType, EUnitType.cm),
    unitScale: types.Number("UnitScale", { preset: 1, precision: 5 }),
};

/**
 * Renderable component representing a Voyager explorer model.
 */
export default class CModel extends CObject3D
{
    static readonly type: string = "CModel";

    ins = this.addInputs(ins);
    outs = this.addOutputs(outs);

    protected assetPath: string = "";
    protected boundingBox = new THREE.Box3();
    protected boxFrame: THREE.Object3D = null;

    protected derivatives: Derivative[] = [];
    protected activeDerivative: Derivative = null;

    create()
    {
        super.create();
        this.object3D = new THREE.Group();
    }

    update()
    {
        const { visible, units, quality, autoLoad, position, rotation, center } = this.ins;

        if (!this.activeDerivative && autoLoad.changed && autoLoad.value) {
            this.autoLoad(quality.value)
            .catch(error => {
                console.warn("Model.update - failed to load derivative");
                console.warn(error);
            });
        }
        else if (quality.changed) {
            const derivative = this.selectDerivative(quality.value);
            if (derivative && derivative !== this.activeDerivative) {
                this.loadDerivative(derivative)
                .catch(error => {
                    console.warn("Model.update - failed to load derivative");
                    console.warn(error);
                });
            }
        }


        if (visible.changed) {
            this.object3D.visible = visible.value;
        }

        if (units.changed) {
            this.updateUnitScale();
            this.emit<IModelChangeEvent>({ type: "change", what: "boundingBox", component: this });
        }
        if (center.changed) {
            this.center();
        }
        if (position.changed || rotation.changed) {
            this.updateMatrix();
        }

        return true;
    }

    dispose()
    {
        this.derivatives.forEach(derivative => derivative.dispose());
        this.activeDerivative = null;

        super.dispose();
    }

    center()
    {
        const object3D = this.object3D;
        const position = this.ins.position;

        object3D.matrix.decompose(_vec3a, _quat, _vec3b);
        object3D.matrix.makeRotationFromQuaternion(_quat);
        _box.makeEmpty();
        computeLocalBoundingBox(object3D, _box, object3D.parent);
        _box.getCenter(_vec3a);
        _vec3a.multiplyScalar(-1).toArray(position.value);
        position.set();
    }

    getBoundingBox()
    {
        return this.boundingBox;
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

        _euler.setFromQuaternion(_quat, "ZYX");
        _euler.toVector3(_vec3a);
        _vec3a.multiplyScalar(math.RAD2DEG).toArray(rotation.value);

        position.set();
        rotation.set();
    }

    setAssetPath(assetPath: string)
    {
        this.assetPath = assetPath;
    }

    addDerivative(derivative: Derivative)
    {
        this.derivatives.push(derivative);
    }

    removeDerivative(derivative: Derivative)
    {
        const index = this.derivatives.indexOf(derivative);
        this.derivatives.splice(index, 1);
    }

    addWebModelDerivative(uri: string, quality: EDerivativeQuality)
    {
        const derivative = new Derivative(EDerivativeUsage.Web, quality);
        derivative.addAsset(uri, EAssetType.Model);
        this.addDerivative(derivative);
    }

    addGeometryAndTextureDerivative(geoUri: string, textureUri: string, quality: EDerivativeQuality)
    {
        const derivative = new Derivative(EDerivativeUsage.Web, quality);
        derivative.addAsset(geoUri, EAssetType.Geometry);
        if (textureUri) {
            derivative.addAsset(textureUri, EAssetType.Image, EMapType.Color);
        }
        this.addDerivative(derivative);
    }

    setShaderMode(shaderMode: EShaderMode)
    {
        this.object3D.traverse(object => {
            const material = object["material"] as UberPBRMaterial;
            if (material && material.isUberPBRMaterial) {
                material.setShaderMode(shaderMode);
            }
        });
    }

    fromData(modelData: IModel): this
    {
        this.ins.units.setValue(EUnitType[modelData.units] || 0);

        if (this.derivatives.length > 0) {
            throw new Error("existing derivatives; failed to inflate from modelData");
        }

        modelData.derivatives.forEach(derivativeData => {
            this.addDerivative(new Derivative(derivativeData));
        });

        if (modelData.transform) {
            _mat4.fromArray(modelData.transform);
            this.setFromMatrix(_mat4);
        }

        if (modelData.boundingBox) {
            this.boundingBox.min.fromArray(modelData.boundingBox.min);
            this.boundingBox.max.fromArray(modelData.boundingBox.max);

            this.boxFrame = new THREE["Box3Helper"](this.boundingBox, "#ffffff");
            this.addChild(this.boxFrame);

            this.emit<IModelChangeEvent>({ type: "change", what: "derivative", component: this });
        }

        //if (modelData.material) {
        // TODO: Implement
        //}

        return this;
    }

    toData(): IModel
    {
        const data: IModel = {
            units: EUnitType[this.ins.units.value] as TUnitType,
            derivatives: this.derivatives.map(derivative => derivative.toData())
        };

        if (this.boundingBox) {
            data.boundingBox = {
                min: this.boundingBox.min.toArray() as Vector3,
                max: this.boundingBox.max.toArray() as Vector3
            }
        }

        if (!threeMath.isMatrix4Identity(this.object3D.matrix)) {
            data.transform = this.object3D.matrix.toArray();
        }

        //if (this.material) {
        // TODO: Implement
        //}

        return data;
    }

    protected updateUnitScale()
    {
        const fromUnits = EUnitType[this.ins.units.getValidatedValue()];
        const toUnits = EUnitType[this.outs.globalUnits.value];
        this.outs.unitScale.setValue(_unitConversionFactor[fromUnits][toUnits]);

        //console.log("Model.updateUnitScale, from: %s, to: %s", fromUnits, toUnits);

        this.updateMatrix();
    }

    protected updateMatrix()
    {
        const ins = this.ins;
        const unitScale = this.outs.unitScale.value;

        _vec3a.fromArray(ins.rotation.value).multiplyScalar(math.DEG2RAD);
        _euler.setFromVector3(_vec3a, "ZYX");
        _vec3a.fromArray(ins.position.value).multiplyScalar(unitScale);
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

        const lowestQualityDerivative = this.selectDerivative(EDerivativeQuality.Thumb);
        if (lowestQualityDerivative) {
            sequence.push(lowestQualityDerivative);
        }

        const targetQualityDerivative = this.selectDerivative(quality);
        if (targetQualityDerivative && targetQualityDerivative !== lowestQualityDerivative) {
            sequence.push(targetQualityDerivative);
        }

        if (sequence.length === 0) {
            return Promise.reject(new Error("no suitable web-derivatives available"));
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
        const loadingManager = this.system.components.safeGet(CLoadingManager);

        return derivative.load(loadingManager, this.assetPath)
        .then(() => {
            if (!derivative.model) {
                return;
            }

            if (this.boxFrame) {
                this.removeChild(this.boxFrame);
                (this.boxFrame as any).geometry.dispose();
            }
            if (this.activeDerivative) {
                this.removeChild(this.activeDerivative.model);
                this.activeDerivative.dispose();
            }

            if (!this.boundingBox && derivative.boundingBox) {
                this.boundingBox = derivative.boundingBox.clone();
            }

            this.activeDerivative = derivative;
            this.addChild(derivative.model);

            this.emit<IModelChangeEvent>({ type: "change", what: "derivative", component: this });

            // TODO: Test
            //const bb = derivative.boundingBox;
            //const box = { min: bb.min.toArray(), max: bb.max.toArray() };
            //console.log("derivative bounding box: ", box);
        });
    }

    /**
     * From all derivatives with the given usage (e.g. web), select a derivative as close as possible to
     * the given quality. The selection strategy works as follows:
     * 1. Look for a derivative matching the quality exactly. If found, return it.
     * 2. Look for a derivative with higher quality. If found, return it.
     * 3. Look for a derivative with lower quality. If found return it, otherwise report an error.
     * @param quality
     * @param usage
     */
    protected selectDerivative(quality: EDerivativeQuality, usage?: EDerivativeUsage): Derivative | null
    {
        usage = usage !== undefined ? usage : EDerivativeUsage.Web;

        const qualityIndex = _qualityLevels.indexOf(quality);

        if (qualityIndex < 0) {
            console.warn(`derivative quality not supported: '${EDerivativeQuality[quality]}'`);
            return null;
        }

        const derivative = this.getDerivative(quality, usage);
        if (derivative) {
            return derivative;
        }

        for (let i = qualityIndex + 1; i < _qualityLevels.length; ++i) {
            const derivative = this.getDerivative(_qualityLevels[i], usage);
            if (derivative) {
                console.warn(`derivative quality '${EDerivativeQuality[quality]}' not available, using higher quality`);
                return derivative;
            }
        }

        for (let i = qualityIndex - 1; i >= 0; --i) {
            const derivative = this.getDerivative(_qualityLevels[i], usage);
            if (derivative) {
                console.warn(`derivative quality '${EDerivativeQuality[quality]}' not available, using lower quality`);
                return derivative;
            }
        }

        console.warn(`no suitable derivative found for quality '${EDerivativeQuality[quality]}'`
            + ` and usage '${EDerivativeUsage[usage]}'`);

        return null;
    }

    /**
     * Returns the derivative with the given quality and usage. Returns null if not found.
     * @param quality The quality level of the derivative.
     * @param usage The usage of the derivative.
     */
    protected getDerivative(quality: EDerivativeQuality, usage?: EDerivativeUsage): Derivative
    {
        usage = usage !== undefined ? usage : EDerivativeUsage.Web;

        for (let i = 0, n = this.derivatives.length; i < n; ++i) {
            const derivative = this.derivatives[i];
            if (derivative && derivative.usage === usage && derivative.quality === quality) {
                return derivative;
            }
        }

        return null;
    }

    protected dumpDerivatives()
    {
        this.derivatives.forEach(derivative => console.log(derivative.toString()));
    }
}

