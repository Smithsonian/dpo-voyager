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

import { Vector3, Matrix4, Quaternion, Euler, MathUtils, EulerOrder } from "three";

import CTransform, { ERotationOrder } from "@ff/scene/components/CTransform";

import { INode } from "client/schema/document";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _mat4 = new Matrix4();
const _quat = new Quaternion();
const _euler = new Euler();

export default class CVNode extends CTransform
{
    static readonly typeName: string = "CVNode";

    static readonly text: string = "Transform";
    static readonly icon: string = "";

    get settingProperties() {
        return [
            this.ins.position,
            this.ins.rotation,
            this.ins.scale,
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.position,
            this.ins.rotation,
            this.ins.scale,
        ];
    }

    fromData(data: INode)
    {
        const { position, rotation, order, scale } = this.ins;

        const orderTag = ERotationOrder[order.getValidatedValue()] as EulerOrder;

        if (data.matrix) {
            _mat4.fromArray(data.matrix);
            _mat4.decompose(_vec3a, _quat, _vec3b);
            _vec3a.toArray(position.value);
            _euler.setFromQuaternion(_quat, orderTag); 
            _vec3a.setFromEuler(_euler).multiplyScalar(MathUtils.RAD2DEG).toArray(rotation.value);
            _vec3b.toArray(scale.value);

            position.set();
            rotation.set();
            scale.set();
        }
        else {
            if (data.translation) {
                position.setValue(data.translation.slice());
            }
            if (data.rotation) {
                _quat.fromArray(data.rotation);
                _euler.setFromQuaternion(_quat, orderTag);
                _vec3a.setFromEuler(_euler).multiplyScalar(MathUtils.RAD2DEG).toArray(rotation.value);
                rotation.set();
            }
            if (data.scale) {
                scale.setValue(data.scale.slice());
            }

            // this updates the matrix from the PRS properties
            this.transform.changed = true;
        }
    }

    toData(): INode
    {
        this.object3D.matrix.decompose(_vec3a, _quat, _vec3b);

        const data: Partial<INode> = {};

        if (_vec3a.x !== 0 || _vec3a.y !== 0 || _vec3a.z !== 0) {
            data.translation = _vec3a.toArray();
        }
        if (_quat.x !== 0 || _quat.y !== 0 || _quat.z !== 0 || _quat.w !== 1) {
            data.rotation = _quat.toArray();
        }
        if (_vec3b.x !== 1 || _vec3b.y !== 1 || _vec3b.z !== 1) {
            data.scale = _vec3b.toArray();
        }

        return data as INode;
    }
}