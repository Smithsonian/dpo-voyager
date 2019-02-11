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

import Component, { types } from "@ff/graph/Component";

import { IInterface } from "common/types/config";

////////////////////////////////////////////////////////////////////////////////

const _inputs = {
    visible: types.Boolean("Interface.Visible", true),
    logo: types.Boolean("Interface.Logo", true),
};

const _outputs = {
    fullscreenAvailable: types.Boolean("Fullscreen.Available", false),
    fullscreenEnabled: types.Boolean("Fullscreen.Enabled", false),
};

export default class CVInterface extends Component
{
    static readonly typeName: string = "CVInterface";

    ins = this.addInputs(_inputs);
    outs = this.addOutputs(_outputs);

    private _fullscreenElement: HTMLElement = null;

    constructor(id: string)
    {
        super(id);
        this.onFullscreenChange = this.onFullscreenChange.bind(this);
    }


    get fullscreenElement() {
        return this._fullscreenElement;
    }
    set fullscreenElement(element: HTMLElement) {

        if (element !== this._fullscreenElement) {
            if (this._fullscreenElement) {
                this._fullscreenElement.removeEventListener("fullscreenchange", this.onFullscreenChange);
            }

            this._fullscreenElement = element;

            if (element) {
                element.addEventListener("fullscreenchange", this.onFullscreenChange);
            }
        }
    }

    toggleFullscreen()
    {
        const outs = this.outs;
        const fullscreenElement = this._fullscreenElement;

        if (fullscreenElement) {
            const state = outs.fullscreenEnabled.value;
            if (!state && outs.fullscreenAvailable.value) {
                fullscreenElement.requestFullscreen();
            }
            else if (state) {
                document.exitFullscreen();
            }
        }
    }

    create()
    {
        this.outs.fullscreenAvailable.setValue(!!document.body.requestFullscreen);
    }

    fromData(data: IInterface)
    {
        this.ins.setValues({
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

    protected onFullscreenChange(event: Event)
    {
        const fullscreenEnabled = !!document["fullscreenElement"];
        this.outs.fullscreenEnabled.setValue(fullscreenEnabled);
    }
}