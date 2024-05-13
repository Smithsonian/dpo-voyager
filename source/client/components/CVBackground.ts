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

import CBackground, { EBackgroundStyle } from "@ff/scene/components/CBackground";
import { Node } from "@ff/scene/components/CObject3D";

import { IBackground, TBackgroundStyle } from "client/schema/setup";

////////////////////////////////////////////////////////////////////////////////


export default class CVBackground extends CBackground
{
    static readonly typeName: string = "CVBackground";

    get settingProperties() {
        return [
            this.ins.style,
            this.ins.color0,
            this.ins.color1,
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.color0,
            this.ins.color1,
        ];
    }

    constructor(node: Node, id: string)
    {
        super(node, id);
        this.background.layers.set(1);
    }

    hide() {
        this.background.visible = false;
    }
    show() {
        this.background.visible = true;
    }

    fromData(data: IBackground)
    {
        this.ins.copyValues({
            style: EBackgroundStyle[data.style] || EBackgroundStyle.Solid,
            color0: data.color0 || [ 0.2, 0.25, 0.3 ],
            color1: data.color1 || [ 0.01, 0.03, 0.05 ],
        });
    }

    toData(): IBackground
    {
        const ins = this.ins;

        return {
            style: EBackgroundStyle[ins.style.value] as TBackgroundStyle,
            color0: ins.color0.cloneValue(),
            color1: ins.color1.cloneValue(),
        };
    }
}