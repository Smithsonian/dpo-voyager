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

import { types } from "@ff/graph/propertyTypes";

import { IInterface } from "common/types/voyager";
import ExplorerComponent from "../ExplorerComponent";

////////////////////////////////////////////////////////////////////////////////

export default class Interface extends ExplorerComponent
{
    static readonly type: string = "Interface";

    ins = this.ins.append({
        visible: types.Boolean_true("Interface.Visible"),
        logo: types.Boolean_true("Interface.Logo"),
    });

    update()
    {
        const system = this.system;
        const { visible, logo } = this.ins;

        if (visible.changed) {
            system.interfaceController.visible = visible.value;
        }
        if (logo.changed) {
            system.interfaceController.logo = logo.value;
        }

        return true;
    }

    fromData(data: IInterface)
    {
        this.ins.setPropertyValues({
            visible: data.visible,
            logo: data.logo
        });
    }

    toData(): IInterface
    {
        const ins = this.ins;

        return {
            visible: ins.visible.value,
            logo: ins.logo.value
        };
    }
}