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

import Component, { types } from "@ff/graph/Component";
import { IPulseContext } from "@ff/graph/components/CPulse";

import { ITarget, ITargets } from "client/schema/model";

import CVModel2 from "./CVModel2";
import CVSetup from "./CVSetup";

////////////////////////////////////////////////////////////////////////////////

export enum ETargetType { Model, Zone };

export default class CVTargets extends Component
{
    static readonly typeName: string = "CVTargets";

    protected static readonly ins = {
        enabled: types.Boolean("Targets.Enabled"),
        active: types.Boolean("Targets.Active", false),
        visible: types.Boolean("Targets.Visible", false),
        type: types.Enum("Targets.Type", ETargetType),
        targetIndex: types.Integer("Targets.Index", -1)
    };

    protected static readonly outs = {
        count: types.Integer("Targets.Count"),
        targetIndex: types.Integer("Target.Index", -1),
        targetTitle: types.String("Target.Title"),
        targetLead: types.String("Target.Lead"),
        zoneCount: types.Integer("Target.Zones", 0)
    };

    ins = this.addInputs(CVTargets.ins);
    outs = this.addOutputs(CVTargets.outs);

    private _targets: ITarget[] = [];

    get targets() {
        return this._targets;
    }

    get activeTarget() { 
        return this._targets[this.outs.targetIndex.value];
    }

    

    update(context: IPulseContext)
    {
        const { ins, outs } = this;

        const targets = this._targets;
  
        const targetIndex = ins.targetIndex.value;
        const target = targets[targetIndex];
        const zoneCount = targets.length;
        outs.zoneCount.setValue(zoneCount);

        if (ins.targetIndex.changed || ins.enabled.changed) {       
            outs.targetIndex.setValue(targetIndex);
            outs.targetTitle.setValue(target ? target.title : "");
        }

        /*if(ins.visible.changed)
        {
            if(this.material && this.material.zoneMap) {
                this.material.enableZoneMap(ins.visible.value);
            }
        }*/

        return true;
    }
}