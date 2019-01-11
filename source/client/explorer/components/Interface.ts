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
import Component from "@ff/graph/Component";

import { IInterface } from "common/types/voyager";
import CExplorer from "./CExplorer";

////////////////////////////////////////////////////////////////////////////////

export default class Interface extends Component
{
    static readonly type: string = "Interface";

    ins = this.ins.append({
        visible: types.Boolean_true("Interface.Visible"),
        logo: types.Boolean_true("Interface.Logo"),
    });

    protected explorer: CExplorer = null;

    create()
    {
        this.explorer = this.system.components.safeGet(CExplorer);
    }

    update()
    {
        const ins = this.ins;
        const explorerIns = this.explorer.ins;

        if (ins.visible.changed) {
            explorerIns.visible.setValue(ins.visible.value);
        }
        if (ins.logo.changed) {
            explorerIns.logo.setValue(ins.logo.value);
        }

        return false;
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