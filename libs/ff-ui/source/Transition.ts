/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CustomElement, { customElement, property, html, PropertyValues, TemplateResult } from "./CustomElement";

////////////////////////////////////////////////////////////////////////////////

export { customElement, property, html };

export type TransitionState = "enter" | "in" | "leave" | "out";

@customElement("ff-transition")
export default class Transition extends CustomElement
{
    @property({ type: Boolean, reflect: true })
    in: boolean = false;

    @property({ attribute: false })
    content: TemplateResult = null;

    @property({ attribute: false })
    state: TransitionState = "out";


    protected firstConnected()
    {
        this.classList.add("ff-transition", "ff-leave", "ff-out");
        this.addEventListener("transitionend", this.onTransitionEnd.bind(this));
    }

    protected update(changedProperties: PropertyValues): void
    {
        if (changedProperties.has("in")) {
            const state = this.state;

            if (this.in && (state === "leave" || state === "out")) {
                this.classList.remove("ff-out");
                setTimeout(() => {
                    this.classList.remove("ff-leave");
                    this.classList.add("ff-enter");
                    this.state = "enter";
                    this.onTransitionEnter();
                });
            }
            else if (!this.in && (state === "enter" || state === "in")) {
                this.classList.remove("ff-in");
                setTimeout(() => {
                    this.classList.remove("ff-enter");
                    this.classList.add("ff-leave");
                    this.state = "leave";
                    this.onTransitionLeave();
                });
            }
        }

        console.log("Transition.update - state: %s", this.state);
        super.update(changedProperties);
    }

    protected render()
    {
        if (this.content){
            return this.state === "out" ? html`` : this.content;
        }

        return null;
    }

    protected onTransitionEnd()
    {
        if (this.state === "enter") {
            this.classList.add("ff-in");
            this.state = "in";
            this.onTransitionIn();
        }
        else if (this.state === "leave") {
            this.classList.add("ff-out");
            this.state = "out";
            this.onTransitionOut();
        }

        this.requestUpdate();
    }

    protected onTransitionIn()
    {
    }

    protected onTransitionOut()
    {
    }

    protected onTransitionEnter()
    {
    }

    protected onTransitionLeave()
    {
    }
}