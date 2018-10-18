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

import clone from "@ff/core/clone";
import { IComponentChangeEvent } from "@ff/core/ecs/Component";

import {
    IDerivative,
    TDerivativeUsage,
    TDerivativeQuality
} from "common/types/item";

import Derivative, { EDerivativeUsage, EDerivativeQuality, EAssetType } from "../app/Derivative";

import Collection from "./Collection";

////////////////////////////////////////////////////////////////////////////////

export { EDerivativeQuality, EDerivativeUsage };

export interface IDerivativesChangeEvent extends IComponentChangeEvent<Derivatives>
{
    what: "add" | "remove";
    derivative: Derivative;
}

export default class Derivatives extends Collection<Derivative>
{
    static readonly type: string = "Derivatives";

    protected static readonly qualityLevels = [
        EDerivativeQuality.Thumb,
        EDerivativeQuality.Low,
        EDerivativeQuality.Medium,
        EDerivativeQuality.High,
        EDerivativeQuality.Highest
    ];

    addWebModelDerivative(uri: string, quality: EDerivativeQuality): string
    {
        const derivative = new Derivative(EDerivativeUsage.Web, quality);
        derivative.addAsset(uri, EAssetType.Model);
        return this.addDerivative(derivative);
    }

    addGeometryAndTextureDerivative(geoUri: string, textureUri: string, quality: EDerivativeQuality): string
    {
        const derivative = new Derivative(EDerivativeUsage.Web, quality);
        derivative.addAsset(geoUri, EAssetType.Geometry);
        derivative.addAsset(textureUri, EAssetType.Image);
        return this.addDerivative(derivative);
    }

    addDerivative(derivative: Derivative): string
    {
        const id = this.insert(derivative);
        this.emit<IDerivativesChangeEvent>("change", { what: "add", derivative });
        return id;
    }

    removeDerivative(id: string): Derivative
    {
        const derivative = this.remove(id);
        this.emit<IDerivativesChangeEvent>("change", { what: "remove", derivative });
        return derivative;
    }

    selectDerivative(quality: EDerivativeQuality, usage?: EDerivativeUsage)
    {
        usage = usage !== undefined ? usage : EDerivativeUsage.Web;

        const qualityLevels = Derivatives.qualityLevels;
        const qualityIndex = qualityLevels.indexOf(quality);

        if (qualityIndex < 0) {
            throw new Error(`derivative quality not supported: '${quality}'`);
        }

        for (let i = qualityIndex; i < qualityLevels.length; ++i) {
            const derivative = this.findDerivative(qualityLevels[i], usage);
            if (derivative) {
                return derivative;
            }
        }

        for (let i = qualityIndex; i >= 0; --i) {
            const derivative = this.findDerivative(qualityLevels[i], usage);
            if (derivative) {
                return derivative;
            }
        }
    }

    findDerivative(quality: EDerivativeQuality, usage?: EDerivativeUsage): Derivative
    {
        usage = usage !== undefined ? usage : EDerivativeUsage.Web;

        const keys = Object.keys(this.items);
        for (let i = 0, n = keys.length; i < n; ++i) {
            const derivative = this.items[keys[i]];
            if (derivative && derivative.usage === usage && derivative.quality === quality) {
                return derivative;
            }
        }

        return null;
    }

    fromData(data: IDerivative[])
    {
        data.forEach(itemData => {
            const usage = EDerivativeUsage[itemData.usage];
            const quality = EDerivativeQuality[itemData.quality];
            this.addDerivative(new Derivative(usage, quality, itemData.assets));
        });
    }

    toData(): IDerivative[]
    {
        const derivatives = this.getArray();

        return derivatives.map(derivative => ({
            usage: EDerivativeUsage[derivative.usage] as TDerivativeUsage,
            quality: EDerivativeQuality[derivative.quality] as TDerivativeQuality,
            assets: clone(derivative.assets)
        }));
    }
}