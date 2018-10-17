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

import Component from "@ff/core/ecs/Component";
import Property from "@ff/core/ecs/Property";

////////////////////////////////////////////////////////////////////////////////

export class SnapshotChannel
{
    readonly id: string;
    readonly component: Component;
    readonly property: Property;

    protected current: any;
    protected values: any[];
    protected isArray: boolean;

    constructor(component: Component, property: Property)
    {
        this.id = component.id + property.key;
        this.component = component;
        this.property = property;

        this.values = [];
        this.isArray = this.property.isArray();
    }

    get name()
    {
        return this.component.type + ":" + this.property.path;
    }

    get length()
    {
        return this.values.length;
    }

    interpolateAt(index0: number, index1: number, f: number, cut: number)
    {
        const values = this.values;
        const prop = this.property;

        const v0 = index0 !== undefined ? values[index0] : prop.value;

        // if (position <= 0) {
        //     this.recallAt(0);
        // }
        // else if (position >= values.length) {
        //     this.recallAt(values.length - 1);
        // }
        // else if (position === Math.floor(position)) {
        //     this.recallAt(position);
        // }
        // else {
        //     const p0 = Math.floor(position);
        //     const v0 = this.values[p0];
        //     const v1 = this.values[p0 + 1];
        //     const f = position - p0;
        //
        //     const prop = this.property;
        //
        //     if (prop.type !== "number" || prop.schema.options) {
        //         this.setValue(f < cut ? v0 : v1);
        //     }
        //     else {
        //         if (this.isArray) {
        //
        //         }
        //         else {
        //
        //         }
        //     }
        // }
    }

    recallAt(index: number)
    {
        this.setValue(this.valueAt(index));
    }

    append()
    {
        this.values.push(this.getValue());
    }

    insertAt(index: number)
    {
        this.values.splice(index, 0, this.getValue());
    }

    replaceAt(index: number)
    {
        this.values[index] = this.getValue();
    }

    removeAt(index: number)
    {
        this.values.splice(index, 1);
    }

    move(from: number, to: number)
    {
        if (from < to) {
            to = to - 1;
        }

        this.values.splice(to, this.values.splice(from, 1)[0]);
    }

    valueAt(index: number)
    {
        return this.values[index];
    }

    setValue(value: any)
    {
        const current = this.property.value;
        let different = false;

        if (Array.isArray(value)) {
            for (let i = 0, n = value.length; i < n; ++i) {
                different = different || current[i] !== value[i];
            }
            if (different) {
                this.property.setValue(value.slice());
            }
        }
        else if (current !== value) {
            this.property.setValue(value);
        }
    }

    getValue()
    {
        return this.property.copyValue();
    }
}