/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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
        if(data.name) this.object3D.name = data.name;

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
        const data: Partial<INode> = {};
        const {position, rotation, scale} = this.ins;
        if (!position.hasInLinks() && position.value.findIndex(n=> n != 0) !==-1) {
            data.translation = position.value.slice();
        }
        if (!rotation.hasInLinks() && rotation.value.findIndex(n=> n != 0) !==-1) {
            _vec3a.fromArray(rotation.value as any);
            _vec3a.multiplyScalar(MathUtils.DEG2RAD);
            _euler.setFromVector3(_vec3a);
            _quat.setFromEuler(_euler);
            data.rotation = _quat.toArray();
        }
        if (!scale.hasInLinks() && scale.value.findIndex(n=> n != 1) !==-1) {
            data.scale = scale.value.slice();
        }

        return data as INode;
    }
}