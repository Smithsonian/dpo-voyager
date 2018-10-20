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

import types from "@ff/core/ecs/propertyTypes";

import { IModel } from "common/types/item";
import AssetLoader from "../loaders/AssetLoader";
import { EShaderMode } from "../shaders/UberMaterial";

import Model from "../app/Model";
import { EDerivativeQuality } from "../app/Derivative";

import Object3D from "./Object3D";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new THREE.Vector3();


export default class ModelComponent extends Object3D
{
    static readonly type: string = "Model";

    ins = this.makeProps({
        alo: types.Boolean("Auto.Load", true),
        asc: types.Boolean("Auto.Pose", true),
        qua: types.Enum("Quality", EDerivativeQuality, EDerivativeQuality.High)
    });

    protected currentModel: Model = null;


    get model(): Model
    {
        return this.object3D as Model;
    }

    create()
    {
        super.create();

        const model = this.object3D = new Model();
        model.onLoad = this.onLoad.bind(this);
        this.object3D = model;
    }

    update()
    {
        const { alo, qua } = this.ins;

        if (!this.currentModel && alo.value) {
            this.model.autoLoad(qua.value)
                .catch(error => {
                    console.warn("Model.update - failed to load derivative");
                    console.warn(error);
                });
        }
    }

    addWebModelDerivative(uri: string, quality: EDerivativeQuality)
    {
        this.model.addWebModelDerivative(uri, quality);
    }

    addGeometryAndTextureDerivative(geoUri: string, textureUri: string, quality: EDerivativeQuality)
    {
        this.model.addGeometryAndTextureDerivative(geoUri, textureUri, quality);
    }

    setShaderMode(shaderMode: EShaderMode)
    {
        this.model.setShaderMode(shaderMode);
    }

    setAssetLoader(assetLoader: AssetLoader, assetPath: string)
    {
        this.model.setAssetLoader(assetLoader, assetPath);
    }

    fromData(data: IModel): this
    {
        this.model.fromData(data);
        return this;
    }

    toData(): IModel
    {
        return this.model.toData();
    }

    protected onLoad()
    {
        // auto scale and center
        if (this.ins.asc && this.transform) {
            const model = this.model;
            const size = model.boundingBox.getSize(_vec3);
            const scale = 10 / Math.max(size.x, size.y, size.z);
            const center = model.boundingBox.getCenter(_vec3);

            this.transform.setValue("Scale", [ scale, scale, scale ]);
            this.transform.setValue("Position", [-center.x * scale, -center.y * scale, -center.z * scale]);
        }
    }
}

