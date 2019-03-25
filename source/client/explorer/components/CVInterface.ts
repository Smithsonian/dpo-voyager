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

import { IInterface } from "common/types/scene";
import CVDocumentProvider from "./CVDocumentProvider";

////////////////////////////////////////////////////////////////////////////////


export default class CVInterface extends Component
{
    static readonly typeName: string = "CVInterface";

    protected static readonly ins = {
        visible: types.Boolean("Interface.Visible", true),
        logo: types.Boolean("Interface.Logo", true),
        menu: types.Boolean("Interface.Menu", true),
        tools: types.Boolean("Interface.Tools", true),
    };

    protected static readonly outs = {
        documentTitle: types.String("Document.Title"),
        fullscreenAvailable: types.Boolean("Fullscreen.Available", false),
        fullscreenEnabled: types.Boolean("Fullscreen.Enabled", false),
    };

    ins = this.addInputs(CVInterface.ins);
    outs = this.addOutputs(CVInterface.outs);

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

    protected get documentProvider() {
        return this.getMainComponent(CVDocumentProvider);
    }
    protected get activeDocument() {
        return this.documentProvider.activeComponent;
    }

    toggleFullscreen()
    {
        const outs = this.outs;
        const e: any = this._fullscreenElement;

        if (e) {
            const state = outs.fullscreenEnabled.value;
            if (!state && outs.fullscreenAvailable.value) {
                if (e.requestFullscreen) {
                    e.requestFullscreen();
                }
                else if (e.mozRequestFullScreen) {
                    e.mozRequestFullScreen();
                }
                else if (e.webkitRequestFullscreen) {
                    e.webkitRequestFullscreen((Element as any).ALLOW_KEYBOARD_INPUT);
                }
            }
            else if (state) {
                const d: any = document;
                if (d.exitFullscreen) {
                    d.exitFullscreen();
                }
                else if (d.cancelFullScreen) {
                    d.cancelFullScreen();
                }
                else if (d.mozCancelFullScreen) {
                    d.mozCancelFullScreen();
                }
                else if (d.webkitCancelFullScreen) {
                    d.webkitCancelFullScreen();
                }
            }
        }
    }

    create()
    {
        const e: any = document.documentElement;
        const fullscreenAvailable = e.requestFullscreen || e.mozRequestFullScreen || e.webkitRequestFullscreen;
        this.outs.fullscreenAvailable.setValue(!!fullscreenAvailable);
    }

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

    protected onFullscreenChange(event: Event)
    {
        const d: any = document;
        const element = d.fullscreenElement || d.mozFullScreenElement || d.webkitFullscreenElement;
        this.outs.fullscreenEnabled.setValue(!!element);
    }
}