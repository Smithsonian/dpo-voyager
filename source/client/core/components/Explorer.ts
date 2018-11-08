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
import types from "@ff/core/ecs/propertyTypes";

import { IExplorer, TUnitType, EUnitType } from "common/types";

import Annotations from "./Annotations";

////////////////////////////////////////////////////////////////////////////////

export default class Explorer extends Component
{
    static readonly type: string = "Explorer";

    ins = this.makeProps({
        eu: types.Enum("Units", EUnitType, EUnitType.cm),
        ae: types.Boolean("Annotations.Enabled", false)
    });

    update()
    {
        const { eu, ae } = this.ins;

        if (eu.changed) {
        }

        if (ae.changed) {
            const enabled = ae.value;
            this.system.getComponents(Annotations).forEach(annotations => annotations.setEnabled(enabled));
        }
    }

    fromData(data: IExplorer)
    {
        this.ins.setValues({
            eu: EUnitType[data.units],
            ae: data.annotationsEnabled
        });
    }

    toData(): IExplorer
    {
        const { eu, ae } = this.ins;

        return {
            units: EUnitType[eu.value] as TUnitType,
            annotationsEnabled: ae.value
        }
    }
}