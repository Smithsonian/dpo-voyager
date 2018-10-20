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

import threeMath from "@ff/three/math";

import { IModel, Vector3, TUnitType } from "common/types/item";

import { EAssetType, EMapType } from "./Asset";
import Derivative, { EDerivativeQuality, EDerivativeUsage } from "./Derivative";
import AssetLoader from "../loaders/AssetLoader";
import UberMaterial, { EShaderMode } from "../shaders/UberMaterial";

////////////////////////////////////////////////////////////////////////////////

const _qualityLevels = [
    EDerivativeQuality.Thumb,
    EDerivativeQuality.Low,
    EDerivativeQuality.Medium,
    EDerivativeQuality.High,
    EDerivativeQuality.Highest
];

export default class Model extends THREE.Group
{
    isModel: boolean = true;

    onLoad: () => void = null;

    units: TUnitType = "cm";
    boundingBox: THREE.Box3 = null;

    protected boxFrame: THREE.Object3D = null;

    protected derivatives: Derivative[] = [];
    protected activeDerivative: Derivative = null;

    protected assetLoader: AssetLoader = null;
    protected assetPath: string = "";

    constructor()
    {
        super();
    }

    autoLoad(quality: EDerivativeQuality): Promise<void>
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

    loadDerivative(derivative: Derivative): Promise<void>
    {
        return derivative.load(this.assetLoader, this.assetPath)
        .then(() => {
            if (!derivative.model) {
                return;
            }

            if (this.boxFrame) {
                this.remove(this.boxFrame);
            }
            if (this.activeDerivative) {
                this.remove(this.activeDerivative.model);
            }

            if (!this.boundingBox && derivative.boundingBox) {
                this.boundingBox = derivative.boundingBox.clone();
            }

            this.activeDerivative = derivative;
            this.add(derivative.model);

            this.onLoad && this.onLoad();

            // TODO: Test
            const bb = derivative.boundingBox;
            const box = { min: bb.min.toArray(), max: bb.max.toArray() };
            console.log("derivative bounding box: ", box);
        });
    }

    addDerivative(derivative: Derivative)
    {
        this.derivatives.push(derivative);
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

    removeDerivative(derivative: Derivative)
    {
        const index = this.derivatives.indexOf(derivative);
        this.derivatives.splice(index, 1);
    }

    selectDerivative(quality: EDerivativeQuality, usage?: EDerivativeUsage): Derivative | null
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

    findDerivative(quality: EDerivativeQuality, usage?: EDerivativeUsage): Derivative
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

    setShaderMode(mode: EShaderMode)
    {
        this.traverse(object => {
            const material = object["material"];
            if (material && material instanceof UberMaterial) {
                material.setShaderMode(mode);
            }
        });
    }

    setAssetLoader(assetLoader: AssetLoader, assetPath: string)
    {
        this.assetLoader = assetLoader;
        this.assetPath = assetPath;
    }

    fromData(data: IModel)
    {
        this.units = data.units;

        data.derivatives.forEach(derivativeData => {
            const usage = EDerivativeUsage[derivativeData.usage];
            const quality = EDerivativeQuality[derivativeData.quality];
            this.addDerivative(new Derivative(usage, quality, derivativeData.assets));
        });

        if (data.transform) {
            this.matrix.fromArray(data.transform);
            this.matrixWorldNeedsUpdate = true;
        }

        if (data.boundingBox) {
            this.boundingBox = new THREE.Box3();
            this.boundingBox.min.fromArray(data.boundingBox.min);
            this.boundingBox.max.fromArray(data.boundingBox.max);

            this.boxFrame = new THREE["Box3Helper"](this.boundingBox, "#ffffff");
            this.add(this.boxFrame);

            // bounding box is first "loaded" derivative, inform component
            this.onLoad && this.onLoad();
        }

        //if (data.material) {
            // TODO: Implement
        //}
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

        if (!threeMath.isMatrix4Identity(this.matrix)) {
            data.transform = this.matrix.toArray();
        }

        //if (this.material) {
            // TODO: Implement
        //}

        return data;
    }
}