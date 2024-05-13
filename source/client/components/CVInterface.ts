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

import { IInterface } from "client/schema/setup";

////////////////////////////////////////////////////////////////////////////////

export enum EUIElements { none = 0, menu = 1, title = 2, logo = 4, language = 8, tour_exit = 16, help = 32}


export default class CVInterface extends Component
{
    static readonly typeName: string = "CVInterface";

    protected static readonly ins = {
        visible: types.Boolean("Interface.Visible", true),
        logo: types.Boolean("Interface.Logo", true),
        menu: types.Boolean("Interface.Menu", true),
        tools: types.Boolean("Interface.Tools", true),
        visibleElements: types.Number("Interface.VisibleElements", 63)
    };

    protected static readonly outs = {
        documentTitle: types.String("Document.Title"),
    };

    ins = this.addInputs(CVInterface.ins);
    outs = this.addOutputs(CVInterface.outs);

    update(context)
    {
        return true;
    }

    fromData(data: IInterface)
    {
        data = data || {} as IInterface;

        this.ins.setValues({
            visible: data.visible !== undefined ? data.visible : true,
            logo: data.logo !== undefined ? data.logo : true,
            menu: data.menu !== undefined ? data.menu : true,
            tools: data.tools !== undefined ? data.tools : true
        });
    }

    toData(): IInterface
    {
        const ins = this.ins;

        return {
            visible: ins.visible.value,
            logo: ins.logo.value,
            menu: ins.menu.value,
            tools: ins.tools.value
        };
    }

    isShowing(element: EUIElements) : boolean
    {
        const ins = this.ins;

        return (element & ins.visibleElements.value) === element;
    }
}