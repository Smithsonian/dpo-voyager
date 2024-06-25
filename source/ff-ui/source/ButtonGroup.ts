/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CustomElement, { customElement, property } from "./CustomElement";
import Button from "./Button";

////////////////////////////////////////////////////////////////////////////////

export type ButtonGroupMode = "exclusive" | "radio";

@customElement("ff-button-group")
export default class ButtonGroup extends CustomElement
{
    @property({ type: String })
    mode: ButtonGroupMode = "radio";

    @property({ type: Number })
    selectionIndex = -1;

    protected observer = new MutationObserver(this.onObserver);
    protected selectedButton: Button = null;

    constructor()
    {
        super();

        this.addEventListener("click", (e) => this.onClick(e));
    }

    protected firstConnected()
    {
        this.classList.add("ff-button-group");
        this.parseChildren();
    }

    protected connected()
    {
        this.observer.observe(this, { childList: true });
    }

    protected disconnected()
    {
        this.observer.disconnect();
    }

    protected onObserver(mutations)
    {
        mutations.forEach(mutation => {
            if (mutation.type === "childList") {
                this.parseChildren();
            }
        });
    }

    protected onClick(event: MouseEvent)
    {
        let target = event.target as HTMLElement;
        while(target && target !== this && !(target instanceof Button)) {
            target = target.parentElement;
        }

        if (!(target instanceof Button)) {
            return;
        }

        if (target.selected) {
            if (this.mode === "exclusive") {
                target.selected = false;
                this.selectedButton = null;
                this.selectionIndex = -1;
            }
        }
        else {
            if (this.selectedButton) {
                this.selectedButton.selected = false;
            }

            this.selectedButton = target;
            this.selectedButton.selected = true;
            this.selectionIndex = this.getButtons().indexOf(target);
        }
    }

    protected parseChildren()
    {
        const buttons = this.getButtons();

        if (this.selectedButton) {
            this.selectionIndex = buttons.indexOf(this.selectedButton);
            if (this.selectionIndex < 0) {
                this.selectedButton.selected = false;
                this.selectedButton = null;
            }
        }

        if (this.selectionIndex < 0 || this.selectionIndex >= buttons.length) {
            this.selectionIndex = this.mode === "radio" ? 0 : -1;
        }

        if (this.selectionIndex >= 0) {
            this.selectedButton = buttons[this.selectionIndex];
            this.selectedButton.selected = true;
        }
    }

    protected getButtons(): Button[]
    {
        return this.getChildrenArray().filter(child => child instanceof Button) as Button[];
    }
}