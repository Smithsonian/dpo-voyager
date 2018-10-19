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
import types from "@ff/core/ecs/propertyTypes";

import {
    IModel as IModelData,
    Vector3,
    TUnitType
} from "common/types/item";

import UberMaterial from "../shaders/UberMaterial";
import AssetLoader from "../loaders/AssetLoader";

import Derivatives, { EDerivativeQuality } from "./Derivatives";
import Derivative from "../app/Derivative";

import { ERotationOrder } from "./Transform";
import Object3D from "./Object3D";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new THREE.Vector3();

export default class Model extends Object3D
{
    static readonly type: string = "Model";

    ins = this.makeProps({
        alo: types.Boolean("Autoload", true),
        qua: types.Enum("Quality", EDerivativeQuality, EDerivativeQuality.Medium),
        pos: types.Vector3("Position"),
        rot: types.Vector3("Rotation"),
        ord: types.Enum("Order", ERotationOrder),
        sca: types.Vector3("Scale", [ 1, 1, 1 ])
    });

    protected units: TUnitType = "cm";
    protected boundingBox: THREE.Box3 = null;
    protected material = new UberMaterial();

    protected derivatives: Derivatives = null;

    protected assetLoader: AssetLoader = null;
    protected assetPath: string = "";

    protected currentModel: THREE.Object3D = null;

    create()
    {
        super.create();

        this.object3D = new THREE.Group();

        this.trackComponent(Derivatives, component => {
            this.derivatives = component;
        }, component => {
            this.derivatives = null;
        });
    }

    update()
    {
        const object = this.object3D;
        const { alo, qua, pos, rot, ord, sca } = this.ins;

        if (!this.currentModel && alo.value) {
            this.load(qua.value)
                .catch(error => {
                    console.warn("Model.update - failed to load derivative");
                    console.warn(error);
                });
        }

        if (pos.changed) {
            console.log("position", pos.value);
            object.position.fromArray(pos.value);
        }
        if (rot.changed) {
            object.rotation.set(
                rot.value[0] * math.DEG2RAD,
                rot.value[1] * math.DEG2RAD,
                rot.value[2] * math.DEG2RAD
            );
        }
        if (ord.changed) {
            object.rotation.order = types.getEnumName(ERotationOrder, ord.value);
        }
        if (sca.changed) {
            console.log("scale", sca.value);
            object.scale.fromArray(sca.value);
        }

        object.updateMatrix();
    }

    load(quality: EDerivativeQuality): Promise<void>
    {
        // display bounding box
        if (!this.currentModel && this.boundingBox) {
            this.currentModel = new THREE["Box3Helper"](this.boundingBox, "#ffffff");
            this.object3D.add(this.currentModel);
        }

        const derivatives = this.derivatives;
        if (!derivatives) {
            return Promise.reject(new Error("missing derivatives component"));
        }

        const sequence = [];

        const thumb = derivatives.findDerivative(EDerivativeQuality.Thumb);
        if (thumb) {
            sequence.push(thumb);
        }

        const second = derivatives.findDerivative(quality);
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

    setAssetLoader(assetLoader: AssetLoader, assetPath: string)
    {
        this.assetLoader = assetLoader;
        this.assetPath = assetPath;
    }

    protected loadDerivative(derivative: Derivative): Promise<void>
    {
        return derivative.load(this.assetLoader, this.assetPath)
        .then(() => {
            if (derivative.model && this.currentModel) {
                this.object3D.remove(this.currentModel);
            }

            if (!this.boundingBox && derivative.boundingBox) {
                this.boundingBox = derivative.boundingBox.clone();
            }

            // TODO: Test
            const bb = derivative.boundingBox;
            const box = { min: bb.min.toArray(), max: bb.max.toArray() };
            console.log("derivative bounding box: ", box);

            this.currentModel = derivative.model;
            this.object3D.add(derivative.model);
        });
    }

    fromData(data: IModelData): this
    {
        this.units = data.units;

        if (data.transform) {
            // decompose transform matrix
            const matrix = this.object3D.matrix;
            matrix.fromArray(data.transform);

            const { pos, rot, ord, sca } = this.ins;
            threeMath.decomposeTransformMatrix(data.transform, pos.value, rot.value, sca.value);
            ord.value = ERotationOrder.XYZ;

            this.ins.setAll();
        }

        if (data.boundingBox) {
            this.boundingBox = new THREE.Box3();
            this.boundingBox.min.fromArray(data.boundingBox.min);
            this.boundingBox.max.fromArray(data.boundingBox.max);

            const size = this.boundingBox.getSize(_vec3);
            const maxSize = Math.max(size.x, size.y, size.z);
            const scale = 10 / maxSize;
            this.ins.sca.setValue([ scale, scale, scale ]);

            const center = this.boundingBox.getCenter(_vec3);
            this.ins.pos.setValue([ -center.x * scale, -center.y * scale, -center.z * scale ]);

            console.log("Model.fromData");
            console.log("  bounding box: ", data.boundingBox);
            console.log("  auto scale: ", scale);
            console.log("  auto translate: ", this.ins.pos.value);
        }

        if (data.material) {
            // TODO: Implement
        }

        return this;
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

        const matrix = this.object3D.matrix;
        if (!threeMath.isMatrix4Identity(matrix)) {
            data.transform = matrix.toArray();
        }

        if (this.material) {
            // TODO: Implement
        }

        return data;
    }
}

