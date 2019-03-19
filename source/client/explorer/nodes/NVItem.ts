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

import { EUnitType, IItem, TUnitType } from "common/types/document";

import NVNode from "./NVNode";

import CVItem from "../components/CVItem";

////////////////////////////////////////////////////////////////////////////////

export default class NVItem extends NVNode
{
    static readonly typeName: string = "NVItem";

    get item() {
        return this.components.get(CVItem);
    }

    createComponents()
    {
        this.createComponent(CVItem);
    }

    fromData(data: IItem)
    {
        if (data.units) {
            this.item.ins.units.setValue(EUnitType[data.units] || EUnitType.inherit);
        }
    }

    toData(): IItem
    {
        const data: IItem = {};

        const units = this.item.ins.units.getValidatedValue();

        if (units !== EUnitType.inherit) {
            data.units = EUnitType[units] as TUnitType;
        }

        return data;
    }
}