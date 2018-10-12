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
import { ComponentTracker } from "@ff/core/ecs/Component";
import types from "@ff/core/ecs/propertyTypes";

import {
    IModel as IModelData,
    Vector3,
    UnitType
} from "common/types/item";

import UberMaterial from "../shaders/UberMaterial";
import AssetLoader from "../loaders/AssetLoader";

import Derivatives, { DerivativeQuality } from "./Derivatives";
import Object3D from "./Object3D";
import { orderOptions } from "./Transform";
import Derivative from "../three/Derivative";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _euler = new THREE.Euler();
const _quat = new THREE.Quaternion();


export default class Model extends Object3D
{
    static readonly type: string = "Model";

    ins = this.makeProps({
        pos: types.Vector3("Position"),
        rot: types.Vector3("Rotation"),
        ord: types.Enum("Order", orderOptions),
        sca: types.Vector3("Scale", [ 1, 1, 1 ])
    });

    protected units: UnitType = "cm";
    protected boundingBox: THREE.Box3 = null;
    protected material = new UberMaterial();
    protected matrix = new THREE.Matrix4();

    protected derivatives: ComponentTracker<Derivatives> = null;

    protected assetLoader: AssetLoader = null;
    protected assetPath: string = "";
    protected currentModel: THREE.Object3D = null;


    create(context)
    {
        super.create(context);

        this.derivatives = this.trackComponent(Derivatives);
        this.assetLoader = context.assetLoader;
        this.assetPath = context.assetPath;

        this.object3D = new THREE.Group();
    }

    update()
    {
        const matrix = this.matrix;
        const { pos, rot, ord, sca } = this.ins;

        _vec3a.fromArray(pos.value);
        _vec3b.fromArray(sca.value);
        _euler.set(rot.value[0], rot.value[1], rot.value[2], math.select(orderOptions, ord.value));
        _quat.setFromEuler(_euler);
        matrix.compose(_vec3a, _quat, _vec3b);

        const object = this.object3D;
        object.matrix = matrix;
        object.matrixWorldNeedsUpdate = true;
    }

    load(quality: DerivativeQuality): Promise<void>
    {
        const derivativesComponent = this.derivatives.component;
        if (!derivativesComponent) {
            return Promise.reject(new Error("missing derivatives component"));
        }

        const sequence = [];

        const thumb = derivativesComponent.findDerivative("thumb");
        if (thumb) {
            sequence.push(thumb);
        }

        const second = derivativesComponent.findDerivative(quality);
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
        .then(object => {
            if (this.currentModel) {
                this.object3D.remove(this.currentModel);
            }

            this.currentModel = object;
            this.object3D.add(object);
        });
    }

    fromData(data: IModelData)
    {
        this.units = data.units;

        if (data.boundingBox) {
            this.boundingBox = new THREE.Box3();
            this.boundingBox.min.fromArray(data.boundingBox.min);
            this.boundingBox.max.fromArray(data.boundingBox.max);
        }

        if (data.transform) {
            this.matrix.fromArray(data.transform);
            this.matrix.decompose(_vec3a, _quat, _vec3b);
            _euler.setFromQuaternion(_quat, "XYZ");

            const { pos, rot, ord, sca } = this.ins;
            _vec3a.toArray(pos.value);
            _vec3b.toArray(sca.value);
            _euler.toVector3(_vec3a);
            _vec3a.toArray(rot.value);
            ord.value = 0;

            this.ins.pushAll();
            this.changed = true;
        }

        if (data.material) {
            // TODO: Implement
        }
    }

    toData(): IModelData
    {
        const data: IModelData = {
            units: this.units,
            derivatives: []
        };

        if (this.boundingBox) {
            data.boundingBox = {
                min: this.boundingBox.min.toArray() as Vector3,
                max: this.boundingBox.max.toArray() as Vector3
            }
        }

        if (this.matrix) {
            data.transform = this.matrix.toArray();
        }

        if (this.material) {
            // TODO: Implement
        }

        return data;
    }
}

