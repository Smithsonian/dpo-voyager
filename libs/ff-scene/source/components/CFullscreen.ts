/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Component, { Node, types } from "@ff/graph/Component";

////////////////////////////////////////////////////////////////////////////////

export default class CFullscreen extends Component
{
    static readonly typeName: string = "CFullscreen";

    protected static readonly ins = {
        toggle: types.Event("Fullscreen.Toggle"),
    };

    protected static readonly outs = {
        fullscreenAvailable: types.Boolean("Fullscreen.Available", false),
        fullscreenActive: types.Boolean("Fullscreen.Active", false),
    };

    ins = this.addInputs(CFullscreen.ins);
    outs = this.addOutputs(CFullscreen.outs);

    private _fullscreenElement: HTMLElement = null;

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

    constructor(node: Node, id: string)
    {
        super(node, id);
        this.onFullscreenChange = this.onFullscreenChange.bind(this);

        const e: any = document.documentElement;
        const fullscreenAvailable = e.requestFullscreen || e.mozRequestFullScreen || e.webkitRequestFullscreen;
        this.outs.fullscreenAvailable.setValue(!!fullscreenAvailable);

        this.ins.toggle.on("value", this.toggle, this);
    }

    update(context)
    {
        return true;
    }

    toggle()
    {
        const outs = this.outs;
        const e: any = this._fullscreenElement;

        if (e) {
            const state = outs.fullscreenActive.value;
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

    protected onFullscreenChange(event: Event)
    {
        const d: any = document;
        const element = d.fullscreenElement || d.mozFullScreenElement || d.webkitFullscreenElement;
        this.outs.fullscreenActive.setValue(!!element);
    }
}