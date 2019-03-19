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
import { IHierarchyEvent } from "@ff/graph/components/CHierarchy";
import CTransform, { types } from "@ff/scene/components/CTransform";

import { EUnitType, IItem } from "common/types/document";

import unitScaleFactor from "../../core/utils/unitScaleFactor";

import CVNode from "./CVNode";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new THREE.Vector3();


export default class CVItem extends CVNode
{
    static readonly typeName: string = "CVItem";

    protected static readonly ins = {
        units: types.Enum("Item.Units", EUnitType, EUnitType.inherit),
    };

    protected static readonly outs = {
        unitScale: types.Number("Item.UnitScale", 1),
    };

    ins = this.addInputs<CTransform, typeof CVItem.ins>(CVItem.ins);
    outs = this.addOutputs<CTransform, typeof CVItem.outs>(CVItem.outs);

    create()
    {
        super.create();
        this.on<IHierarchyEvent>("hierarchy", this.updateUnitScale, this);
    }

    dispose()
    {
        this.off<IHierarchyEvent>("hierarchy", this.updateUnitScale, this);
        super.dispose();
    }

    update(context)
    {
        const object3D = this.object3D;
        const { units, position, rotation, order, scale } = this.ins;
        const { matrix } = this.outs;

        if (units.changed) {
            this.updateUnitScale();
        }

        object3D.position.fromArray(position.value);
        _vec3a.fromArray(rotation.value).multiplyScalar(math.DEG2RAD);
        const orderName = order.getOptionText();
        object3D.rotation.setFromVector3(_vec3a, orderName);
        object3D.scale.fromArray(scale.value).multiplyScalar(this.outs.unitScale.value);
        object3D.updateMatrix();

        (object3D.matrix as any).toArray(matrix.value);
        matrix.set();

        return true;
    }

    protected updateUnitScale()
    {
        const parent = this.getParentComponent(CVItem, true);
        if (!parent) {
            this.outs.unitScale.setValue(1);
        }

        const fromUnits = this.ins.units.value;
        const toUnits = parent.ins.units.value;

        this.outs.unitScale.setValue(unitScaleFactor(fromUnits, toUnits));
        this.changed = true;
    }
}