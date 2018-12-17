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

import { types } from "@ff/graph";
import { Object3D } from "@ff/scene/components";

import { IModel, TUnitType, Vector3 } from "common/types/item";

import UberMaterial, { EShaderMode } from "../shaders/UberMaterial";
import AssetLoader from "../loaders/AssetLoader";
import Derivative, { EDerivativeQuality, EDerivativeUsage } from "../models/Derivative";
import { EAssetType, EMapType } from "../models/Asset";

import Renderer from "./Renderer";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _quatZero = new THREE.Quaternion();
const _euler = new THREE.Euler();

const _qualityLevels = [
    EDerivativeQuality.Thumb,
    EDerivativeQuality.Low,
    EDerivativeQuality.Medium,
    EDerivativeQuality.High,
    EDerivativeQuality.Highest
];

export { EShaderMode };

export default class ModelComponent extends Object3D
{
    static readonly type: string = "Model";

    ins = this.ins.append({
        qua: types.Enum("Quality", EDerivativeQuality, EDerivativeQuality.High),
        alo: types.Boolean("Auto.Load", true),
        pos: types.Vector3("Pose.Position"),
        rot: types.Vector3("Pose.Rotation"),
        sca: types.Number("Pose.Scale", 1)
    });

    outs = this.outs.append({
        asc: types.Number("Auto.Scale", 1),
        aof: types.Vector3("Auto.Offset")
    });

    protected units: TUnitType = "cm";
    protected boundingBox: THREE.Box3 = null;

    protected boxFrame: THREE.Object3D = null;

    protected derivatives: Derivative[] = [];
    protected activeDerivative: Derivative = null;

    protected assetLoader: AssetLoader = null;
    protected assetPath: string = "";


    create()
    {
        super.create();
        this.object3D = new THREE.Group();
    }

    update()
    {
        const { qua, alo, pos, rot, sca } = this.ins;

        if (!this.activeDerivative && alo.value) {
            this.autoLoad(qua.value)
            .catch(error => {
                console.warn("Model.update - failed to load derivative");
                console.warn(error);
            });
        }

        if (pos.changed || rot.changed || sca.changed) {
            const object3D = this.object3D;
            object3D.position.fromArray(pos.value);
            _vec3a.fromArray(rot.value).multiplyScalar(math.DEG2RAD);
            object3D.rotation.setFromVector3(_vec3a, "ZYX");
            object3D.updateMatrix();
        }

        return true;
    }

    dispose()
    {
        this.derivatives.forEach(derivative => derivative.dispose());
        this.activeDerivative = null;

        super.dispose();
    }

    getBoundingBox()
    {
        return this.boundingBox;
    }

    updatePropsFromMatrix()
    {
        const { pos, rot, sca } = this.ins;

        this.object3D.matrix.decompose(_vec3a, _quat, _vec3b);

        _vec3a.toArray(pos.value);

        _euler.setFromQuaternion(_quat, "ZYX");
        _euler.toVector3(_vec3a);
        _vec3a.multiplyScalar(math.RAD2DEG).toArray(rot.value);

        sca.value = _vec3b.x;

        pos.set();
        rot.set();
        sca.set();
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
            const material = object["material"];
            if (material && material instanceof UberMaterial) {
                material.setShaderMode(shaderMode);
            }
        });
    }

    setAssetLoader(assetLoader: AssetLoader, assetPath: string)
    {
        this.assetLoader = assetLoader;
        this.assetPath = assetPath;
    }

    fromData(data: IModel): this
    {
        this.units = data.units;

        data.derivatives.forEach(derivativeData => {
            const usage = EDerivativeUsage[derivativeData.usage];
            const quality = EDerivativeQuality[derivativeData.quality];
            this.addDerivative(new Derivative(usage, quality, derivativeData.assets));
        });

        if (data.transform) {
            this.object3D.matrix.fromArray(data.transform);
            this.object3D.matrixWorldNeedsUpdate = true;
            this.updatePropsFromMatrix();
        }

        if (data.boundingBox) {
            this.boundingBox = new THREE.Box3();
            this.boundingBox.min.fromArray(data.boundingBox.min);
            this.boundingBox.max.fromArray(data.boundingBox.max);

            this.boxFrame = new THREE["Box3Helper"](this.boundingBox, "#ffffff");
            this.object3D.add(this.boxFrame);

            // update auto scale
            this.onLoad();
        }

        //if (data.material) {
        // TODO: Implement
        //}

        return this;
    }

    toData(): IModel
    {
        const data: IModel = {
            units: this.units,
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

        console.log(data.transform);
        //if (this.material) {
        // TODO: Implement
        //}

        return data;
    }

    protected autoLoad(quality: EDerivativeQuality): Promise<void>
    {
        const sequence = [];

        const thumb = this.findDerivative(EDerivativeQuality.Thumb);
        if (thumb) {
            sequence.push(thumb);
        }

        const second = this.selectDerivative(quality);
        if (second) {
            sequence.push(second);
        }

        if (sequence.length === 0) {
            return Promise.reject(new Error("no suitable web-derivatives available"));
        }

        return sequence.reduce((promise, derivative) => {
            return promise.then(() => this.loadDerivative(derivative));
        }, Promise.resolve());
    }

    protected loadDerivative(derivative: Derivative): Promise<void>
    {
        return derivative.load(this.assetLoader, this.assetPath)
        .then(() => {
            if (!derivative.model) {
                return;
            }

            if (this.boxFrame) {
                this.object3D.remove(this.boxFrame);
                (this.boxFrame as any).geometry.dispose();
            }
            if (this.activeDerivative) {
                this.object3D.remove(this.activeDerivative.model);
                this.activeDerivative.dispose();
            }

            if (!this.boundingBox && derivative.boundingBox) {
                this.boundingBox = derivative.boundingBox.clone();
            }

            this.activeDerivative = derivative;
            this.object3D.add(derivative.model);
            this.onLoad();

            // TODO: Test
            const bb = derivative.boundingBox;
            const box = { min: bb.min.toArray(), max: bb.max.toArray() };
            console.log("derivative bounding box: ", box);
        });
    }

    protected onLoad()
    {
    }

    protected selectDerivative(quality: EDerivativeQuality, usage?: EDerivativeUsage): Derivative | null
    {
        usage = usage !== undefined ? usage : EDerivativeUsage.Web;

        const qualityIndex = _qualityLevels.indexOf(quality);

        if (qualityIndex < 0) {
            throw new Error(`derivative quality not supported: '${EDerivativeQuality[quality]}'`);
        }

        const derivative = this.findDerivative(quality, usage);
        if (derivative) {
            return derivative;
        }

        for (let i = qualityIndex + 1; i < _qualityLevels.length; ++i) {
            const derivative = this.findDerivative(_qualityLevels[i], usage);
            if (derivative) {
                console.warn(`derivative quality '${EDerivativeQuality[quality]}' not available, using higher quality`);
                return derivative;
            }
        }

        for (let i = qualityIndex - 1; i >= 0; --i) {
            const derivative = this.findDerivative(_qualityLevels[i], usage);
            if (derivative) {
                console.warn(`derivative quality '${EDerivativeQuality[quality]}' not available, using lower quality`);
                return derivative;
            }
        }

        console.warn(`no suitable derivative found for quality '${EDerivativeQuality[quality]}'`
            + ` and usage '${EDerivativeUsage[usage]}'`);
        return null;
    }

    protected findDerivative(quality: EDerivativeQuality, usage?: EDerivativeUsage): Derivative
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
}

