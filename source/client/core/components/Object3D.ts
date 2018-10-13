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

import Component from "@ff/core/ecs/Component";

import Transform from "./Transform";

////////////////////////////////////////////////////////////////////////////////

export default class Object3D extends Component
{
    static readonly type: string = "Object3D";

    protected transform: Transform = null;
    private _object: THREE.Object3D = null;

    get object3D(): THREE.Object3D | null
    {
        return this._object;
    }

    set object3D(object: THREE.Object3D)
    {
        if (this._object && this.transform) {
            this.transform.removeObject3D(this._object);
        }

        this._object = object;

        if (object) {
            object.matrixAutoUpdate = false;

            if (this.transform) {
                this.transform.addObject3D(object);
            }
        }
    }

    create()
    {
        this.trackComponent(Transform, transform => {
            this.transform = transform;
            if (this._object) {
                transform.addObject3D(this._object);
            }
        }, transform => {
            this.transform = null;
            if (this._object) {
                transform.removeObject3D(this._object);
            }
        });
    }

    dispose()
    {
        if (this._object && this.transform) {
            this.transform.removeObject3D(this._object);
        }

        super.dispose();
    }

    toString()
    {
        return super.toString() + (this._object ? ` - type: ${this._object.type}` : " - (null)");
    }
}