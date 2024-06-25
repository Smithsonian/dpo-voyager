/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Transition, { customElement, html } from "./Transition";

////////////////////////////////////////////////////////////////////////////////

@customElement("ff-slide-transition")
export default class SlideTransition extends Transition
{
    //private _height = 0;
    private _innerRoot: HTMLElement = null;

    protected firstConnected()
    {
        console.log("SlideTransition.firstConnected");
        super.firstConnected();
        this.classList.add("ff-slide-transition");
    }

    // protected createRenderRoot()
    // {
    //     console.log("SlideTransition.createRenderRoot");
    //     this._innerRoot = document.createElement("div");
    //     this._innerRoot.classList.add("ff-inner");
    //     console.log(this._innerRoot);
    //     return this._innerRoot;
    // }

    protected render()
    {
        if (this.content){
            return html`<div class="ff-inner">${this.state === "out" ? null : this.content}</div>`;
        }

        return null;
    }

    protected onTransitionEnter()
    {
        const rect = this.getElementsByClassName("ff-inner").item(0).getBoundingClientRect();
        this.style.height = rect.height + "px";
        console.log("SlideTransition.onTransitionEnter: height = %s", this.style.height);
    }

    protected onTransitionLeave()
    {
        this.style.height = "0";
        console.log("SlideTransition.onTransitionLeave: height = %s", this.style.height);
    }
}