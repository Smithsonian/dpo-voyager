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
import Node from "@ff/graph/Node";
import CTransform from "@ff/scene/components/CTransform";

import { INode } from "common/types/presentation";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();

export default class NVNode extends Node
{
    static readonly typeName: string = "NVNode";

    get transform() {
        return this.components.get(CTransform);
    }

    createComponents()
    {
        this.createComponent(CTransform);
    }

    fromNodeData(node: INode)
    {
        const { position, rotation, order, scale } = this.transform.ins;

        order.setValue(0);

        if (node.matrix) {
            _mat4.fromArray(node.matrix);
            _mat4.decompose(_vec3a, _quat, _vec3b);
            _vec3a.toArray(position.value);
            _euler.setFromQuaternion(_quat, "XYZ");
            _euler.toVector3(_vec3a).multiplyScalar(math.RAD2DEG).toArray(rotation.value);
            _vec3b.toArray(scale.value);

            position.set();
            rotation.set();
            scale.set();
        }
        else {
            if (node.translation) {
                position.setValue(node.translation.slice());
            }
            if (node.rotation) {
                _quat.fromArray(node.rotation);
                _euler.setFromQuaternion(_quat, "XYZ");
                _euler.toVector3(_vec3a).multiplyScalar(math.RAD2DEG).toArray(rotation.value);
                rotation.set();
            }
            if (node.scale) {
                scale.setValue(node.scale.slice());
            }

            // this updates the matrix from the PRS properties
            this.transform.changed = true;
        }
    }

    toNodeData(): INode
    {
        this.transform.object3D.matrix.decompose(_vec3a, _quat, _vec3b);

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