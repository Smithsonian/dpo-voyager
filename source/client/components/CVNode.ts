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

import { Vector3, Matrix4, Quaternion, Euler, MathUtils, EulerOrder, Box3 } from "three";

import CTransform, { ERotationOrder } from "@ff/scene/components/CTransform";

import { INode } from "client/schema/document";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _mat4 = new Matrix4();
const _quat = new Quaternion();
const _euler = new Euler();
const defaultPosition = new Vector3(0,0,0);
const defaultRotation = new Quaternion(0,0,0,1);
const defaultScale = new Vector3(1,1,1);

export default class CVNode extends CTransform
{
    static readonly typeName: string = "CVNode";

    static readonly text: string = "Transform";
    static readonly icon: string = "";

    private _savedDocumentData: any = {};

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

    update(context)
    {
        // handle potential zero-scale matrix collapse
        // by converting to very small number
        if(this.ins.scale.changed) {
            const scale = this.ins.scale.value;
            for(let i=0; i<3; i++) {
                if(scale[i] === 0.0) {
                    scale[i] = 1e-10;
                }
            }
        }

        super.update(context);

        return true;
    }

    fromData(data: INode)
    {
        this._savedDocumentData = JSON.parse(JSON.stringify(data));
        this.setFromSavedData();
    }

    setFromSavedData(){
        const { position, rotation, order, scale } = this.ins;
        const data = this._savedDocumentData;

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
            position.setValue(data.translation ? data.translation.slice() : defaultPosition.toArray());
            if (data.rotation) {
                _quat.fromArray(data.rotation);
                _euler.setFromQuaternion(_quat, orderTag);
                _vec3a.setFromEuler(_euler).multiplyScalar(MathUtils.RAD2DEG).toArray(rotation.value);
                rotation.set();
            } else {
                rotation.setValue(defaultRotation.toArray());
            }
            scale.setValue(data.scale? data.scale.slice():defaultScale.toArray());
            // this updates the matrix from the PRS properties
            this.transform.changed = true;
        }
    }

    toData(): INode
    {
        this.object3D.matrix.decompose(_vec3a, _quat, _vec3b);

        const data: Partial<INode> = {};

        if (!_vec3a.equals(defaultPosition)) {
            data.translation = _vec3a.toArray();
        }
        if (!_quat.equals(defaultRotation)) {
            data.rotation = _quat.toArray();
        }
        if (!_vec3b.equals(defaultScale)) {
            data.scale = _vec3b.toArray();
        }

        return data as INode;
    }
}