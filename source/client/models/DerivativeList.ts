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

import { Dictionary } from "@ff/core/types";

import { IDerivative } from "client/schema/model";

import Derivative, { EDerivativeQuality, EDerivativeUsage } from "./Derivative";
import Asset, { EMapType } from "./Asset";

////////////////////////////////////////////////////////////////////////////////

const _EMPTY_ARRAY = [];

const _qualityLevels = [
    EDerivativeQuality.Thumb,
    EDerivativeQuality.AR,
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
        const derivatives = this.derivatives[key] || _EMPTY_ARRAY;

        return derivatives.sort((a, b) => {
            if (a.data.quality < b.data.quality) return -1;
            if (a.data.quality > b.data.quality) return 1;
            return 0;
        });
    }

    getByQuality(quality: EDerivativeQuality): Derivative[]
    {
        const derivatives = this.getArray();

        return derivatives.filter(a => a.data.quality === quality);
    }

    getArray(): Derivative[]
    {
        return Object.keys(this.derivatives)
            .reduce((arr, key) => arr.concat(this.derivatives[key]), []);
    }

    get(usage: EDerivativeUsage, quality: EDerivativeQuality): Derivative | null
    {
        const key = EDerivativeUsage[usage];
        const bin = this.derivatives[key];

        if (bin) {
            for (let i = 0, n = bin.length; i < n; ++i) {
                if (bin[i].data.quality === quality) {
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
            if (bin[i].data.quality === quality) {
                return bin[i];
            }
        }

        const derivative = new Derivative();
        derivative.set("usage", usage);
        derivative.set("quality", quality);
        bin.push(derivative);
        return derivative;
    }

    remove(usage: EDerivativeUsage, quality: EDerivativeQuality)
    {
        const derivative = this.get(usage, quality);
        if(derivative) {
            const bin = this.getOrCreateBin(usage);
            const index = bin.indexOf(derivative);
            if (index > -1) {
                bin.splice(index, 1);
            }
        }
    }

    createModelAsset(assetPath: string, quality: EDerivativeQuality | string): Derivative
    {
        quality = (typeof quality === "string" ? EDerivativeQuality[quality] : quality) as EDerivativeQuality;
        quality = quality != null ? quality : EDerivativeQuality.Medium;

        const derivative = this.getOrCreate(EDerivativeUsage.Web3D, quality);

        const asset = new Asset();
        asset.setModel(assetPath);
        derivative.addAsset(asset);

        return derivative;
    }

    createMeshAsset(geoPath: string, colorMapPath?: string, occlusionMapPath?: string, normalMapPath?: string, quality?: EDerivativeQuality | string): Derivative
    {
        quality = (typeof quality === "string" ? EDerivativeQuality[quality] : quality) as EDerivativeQuality;
        quality = quality != null ? quality : EDerivativeQuality.Medium;

        const derivative = this.getOrCreate(EDerivativeUsage.Web3D, quality);

        const geoAsset = new Asset();
        geoAsset.setGeometry(geoPath);
        derivative.addAsset(geoAsset);

        if (colorMapPath) {
            const colorMapAsset = new Asset();
            colorMapAsset.setTexture(colorMapPath, EMapType.Color);
            derivative.addAsset(colorMapAsset);
        }
        if (occlusionMapPath) {
            const occlusionMapAsset = new Asset();
            occlusionMapAsset.setTexture(occlusionMapPath, EMapType.Occlusion);
            derivative.addAsset(occlusionMapAsset);
        }
        if (normalMapPath) {
            const normalMapAsset = new Asset();
            normalMapAsset.setTexture(normalMapPath, EMapType.Normal);
            derivative.addAsset(normalMapAsset);
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

    toJSON(): IDerivative[]
    {
        const data = [];

        for (let key in this.derivatives) {
            this.derivatives[key].forEach(derivative => data.push(derivative.toJSON()));
        }

        return data;
    }

    fromJSON(data: IDerivative[])
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