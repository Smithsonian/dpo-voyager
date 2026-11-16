/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CustomElement, { customElement, html, property } from "./CustomElement";
import { showPopover, IPopoverPlacement } from "./popover";

////////////////////////////////////////////////////////////////////////////////

export interface IPopupMenuSelectEvent extends CustomEvent
{
    detail: {
        index: number;
        option: string;
    }
}

/**
 * List of options to pick from, shown as a popover next to an anchor element.
 * Closes on selection, Escape and clicks outside, and removes itself when closed.
 */
@customElement("ff-popup-options")
export default class PopupOptions extends CustomElement
{
    static readonly selectEvent = "ff-select";

    @property({ attribute: false })
    options: string[];

    @property({ type: Number })
    selectionIndex: number;

    constructor(options?: string[])
    {
        super();

        this.onClick = this.onClick.bind(this);
        this.onToggle = this.onToggle.bind(this);

        this.addEventListener("click", this.onClick);
        this.addEventListener("toggle", this.onToggle);

        this.options = options || [];
        this.selectionIndex = -1;
    }

    /** Appends the element to `parent` and shows it next to `anchor`, focusing the selected option. */
    show(parent: HTMLElement, anchor: Element, placement?: IPopoverPlacement)
    {
        parent.appendChild(this);

        return this.updateComplete.then(() => {
            showPopover(this, anchor, placement);

            const index = this.selectionIndex >= 0 ? this.selectionIndex : 0;
            const button = this.children.item(index) as HTMLButtonElement;
            if (button) {
                button.focus();
            }
        });
    }

    protected firstConnected()
    {
        super.firstConnected();

        this.setAttribute("popover", "auto");
        this.classList.add("ff-popup-options");
    }

    protected render()
    {
        return html`
            ${this.options.map((option, index) => html`
                <button>${option}</button>
            `)}
        `;
    }

    protected onClick(event: MouseEvent)
    {
        const children = this.getChildrenArray();
        const index = children.indexOf(event.target as Element);

        if (index >= 0 && index < this.options.length) {
            this.dispatchEvent(new CustomEvent(PopupOptions.selectEvent, { detail: {
                    index,
                    option: this.options[index]
                }}) as IPopupMenuSelectEvent);
        }

        this.hidePopover();
    }

    protected onToggle(event: Event)
    {
        if ((event as ToggleEvent).newState === "closed") {
            this.remove();
        }
    }
}
