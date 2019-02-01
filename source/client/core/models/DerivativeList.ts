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

import { Dictionary } from "@ff/core/types";

import { IDerivative } from "common/types/item";

import Derivative, { EDerivativeQuality, EDerivativeUsage } from "./Derivative";
import { EAssetType, EMapType } from "./Asset";

////////////////////////////////////////////////////////////////////////////////

const _EMPTY_ARRAY = [];

const _qualityLevels = [
    EDerivativeQuality.Thumb,
    EDerivativeQuality.Low,
    EDerivativeQuality.Medium,
    EDerivativeQuality.High,
    EDerivativeQuality.Highest
];

export default class DerivativeList
{
    protected derivatives: Dictionary<Derivative[]> = {};

    /**
     * From all derivatives with the given usage (e.g. web), select a derivative as close as possible to
     * the given quality. The selection strategy works as follows:
     * 1. Look for a derivative matching the quality exactly. If found, return it.
     * 2. Look for a derivative with higher quality. If found, return it.
     * 3. Look for a derivative with lower quality. If found return it, otherwise report an error.
     * @param quality
     * @param usage
     */
    select(usage: EDerivativeUsage, quality: EDerivativeQuality): Derivative | null
    {
        const usageKey = EDerivativeUsage[usage];
        const qualityKey = EDerivativeQuality[quality];

        const qualityIndex = _qualityLevels.indexOf(quality);

        if (qualityIndex < 0) {
            console.warn(`derivative quality not supported: '${qualityKey}'`);
            return null;
        }

        const derivative = this.get(usage, quality);
        if (derivative) {
            return derivative;
        }

        for (let i = qualityIndex + 1; i < _qualityLevels.length; ++i) {
            const derivative = this.get(usage, _qualityLevels[i]);
            if (derivative) {
                console.warn(`derivative quality '${qualityKey}' not available, using higher quality`);
                return derivative;
            }
        }

        for (let i = qualityIndex - 1; i >= 0; --i) {
            const derivative = this.get(usage, _qualityLevels[i]);
            if (derivative) {
                console.warn(`derivative quality '${qualityKey}' not available, using lower quality`);
                return derivative;
            }
        }

        console.warn(`no suitable derivative found for quality '${qualityKey}'`
            + ` and usage '${usageKey}'`);

        return null;
    }

    getByUsage(usage: EDerivativeUsage): Derivative[]
    {
        const key = EDerivativeUsage[usage];
        return this.derivatives[key] || _EMPTY_ARRAY;
    }

    getArray(): Derivative[]
    {
        return Object.keys(this.derivatives).reduce((arr, key) => arr.concat(this.derivatives[key]), []);
    }

    get(usage: EDerivativeUsage, quality: EDerivativeQuality): Derivative | null
    {
        const key = EDerivativeUsage[usage];
        const bin = this.derivatives[key];

        if (bin) {
            for (let i = 0, n = bin.length; i < n; ++i) {
                if (bin[i].quality === quality) {
                    return bin[i];
                }
            }
        }

        return null;
    }

    getOrCreate(usage: EDerivativeUsage, quality: EDerivativeQuality): Derivative
    {
        const bin = this.getOrCreateBin(usage);
        for (let i = 0, n = bin.length; i < n; ++i) {
            if (bin[i].quality === quality) {
                return bin[i];
            }
        }

        const derivative = new Derivative(usage, quality);
        bin.push(derivative);
        return derivative;
    }

    createModelAsset(uri: string, quality: EDerivativeQuality): Derivative
    {
        const derivative = this.getOrCreate(EDerivativeUsage.Web3D, quality);
        derivative.createAsset(EAssetType.Model, uri);
        return derivative;
    }

    createMeshAsset(geoUri: string, textureUri: string, quality: EDerivativeQuality): Derivative
    {
        const derivative = this.getOrCreate(EDerivativeUsage.Web3D, quality);
        derivative.createAsset(EAssetType.Geometry, geoUri);

        if (textureUri) {
            const asset = derivative.createAsset(EAssetType.Image, textureUri);
            asset.mapType = EMapType.Color;
        }

        return derivative;
    }

    clear()
    {
        for (let key in this.derivatives) {
            this.derivatives[key].forEach(derivative => derivative.dispose());
        }

        this.derivatives = {};
    }

    toData(): IDerivative[]
    {
        const data = [];

        for (let key in this.derivatives) {
            this.derivatives[key].forEach(derivative => data.push(derivative.toData()));
        }

        return data;
    }

    fromData(data: IDerivative[])
    {
        this.clear();

        data.forEach(derivativeData => {
            const bin = this.getOrCreateBin(EDerivativeUsage[derivativeData.usage]);
            bin.push(new Derivative(derivativeData));
        });
    }

    toString(verbose: boolean = false)
    {
        const derivatives = this.derivatives;
        const keys = Object.keys(derivatives);

        if (verbose) {
            return `Derivatives (${keys.length}) \n ` + keys.map(key => derivatives[key].map(derivative => derivative.toString(true)).join("\n ")).join("\n ");
        }
        else {
            return `Derivatives (${keys.length}) ` + keys.map(key => `${key} (${derivatives[key].length})`).join(", ");
        }
    }

    protected getOrCreateBin(usage: EDerivativeUsage)
    {
        const key = EDerivativeUsage[usage];
        return this.derivatives[key] || (this.derivatives[key] = []);
    }
}