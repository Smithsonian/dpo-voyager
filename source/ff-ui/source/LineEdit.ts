/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CustomElement, { customElement, property, html, PropertyValues } from "./CustomElement";

////////////////////////////////////////////////////////////////////////////////

export type TextAlign = "left" | "right" | "center";

/**
 * Emitted by [[LineEdit]] when the control's text is edited.
 * @event
 */
export interface ILineEditChangeEvent extends CustomEvent
{
    type: "change";
    target: LineEdit;
    detail: {
        /** The current text. */
        text: string;
        /** True if the editing is ongoing, false if the edit is committed. */
        isEditing: boolean;
    }
}

/**
 * Custom element displaying a single line text edit.
 *
 * ### Events
 * - *"change"* - [[ILineEditChangeEvent]] emitted when the control's text is edited.
 */
@customElement("ff-line-edit")
export default class LineEdit extends CustomElement
{
    /** Optional name to identify the button. */
    @property({ type: String })
    name = "";

    /** Optional index to identify the button. */
    @property({ type: Number })
    index = 0;

    /** Text to be edited in the control. */
    @property({ type: String })
    text = "";

    /** Placeholder text to display if no other text is present. */
    @property({ type: String })
    placeholder = "";

    @property({ type: String })
    align: TextAlign = "left";

    protected initialValue: string = "";
    protected requestFocus = false;

    protected get inputElement() {
        return this.getElementsByTagName("input").item(0) as HTMLInputElement;
    }

    focus()
    {
        this.requestFocus = true;
        this.performUpdate();
    }

    hasFocus()
    {
        const activeElement = document.activeElement.shadowRoot ? document.activeElement.shadowRoot.activeElement : document.activeElement;
        return this.inputElement === activeElement;
    }

    protected firstConnected()
    {
        this.classList.add("ff-control", "ff-line-edit");
    }

    protected shouldUpdate(changedProperties: PropertyValues): boolean
    {
        // prevent rendering during editing
        if (this.hasFocus()) {
            return false;
        }

        return super.shouldUpdate(changedProperties);
    }

    protected render()
    {
        return html`<input
            type="text" .value=${this.text} placeholder=${this.placeholder}
            @keydown=${this.onKeyDown} @change=${this.onChange} @input=${this.onInput}
            @focus=${this.onFocus} @blur=${this.onBlur}
            style="box-sizing: border-box; width:100%; text-align: ${this.align};">`;
    }

    protected updated()
    {
        if (this.requestFocus) {
            this.requestFocus = false;
            this.inputElement.focus();
        }
    }

    protected onKeyDown(event: KeyboardEvent)
    {
        const target = event.target as HTMLInputElement;

        if (event.key === "Enter") {
            this.commit(target);
            target.blur();
        }
        else if (event.key === "Escape") {
            this.revert(target);
            target.blur();
        }
    }

    protected onChange(event)
    {
        event.stopPropagation();
        event.preventDefault();

        this.text = event.target.value;
        this.dispatchChangeEvent(this.text, false);
    }

    protected onInput(event)
    {
        event.stopPropagation();
        event.preventDefault();

        this.text = event.target.value;
        this.dispatchChangeEvent(this.text, true);
    }

    protected onFocus(event)
    {
        this.initialValue = event.target.value;
        event.target.select();
    }

    protected onBlur(event)
    {
        this.commit(event.target);
        this.requestUpdate();
    }

    protected revert(element: HTMLInputElement)
    {
        element.value = this.initialValue;
        this.dispatchChangeEvent(element.value, false);
    }

    protected commit(element: HTMLInputElement)
    {
        this.initialValue = element.value;
        this.dispatchChangeEvent(element.value, false);
    }

    protected dispatchChangeEvent(text: string, isEditing: boolean)
    {
        this.dispatchEvent(new CustomEvent("change", {
            detail: {
                text,
                isEditing
            }
        }));
    }
}