/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CustomElement, { customElement, property, html, PropertyValues } from "./CustomElement";
import {ifDefined} from 'lit-html/directives/if-defined';

////////////////////////////////////////////////////////////////////////////////

export type TextAlign = "left" | "right" | "center";

/**
 * Emitted when the text is edited.
 * @event change
 */
export interface ITextEditChangeEvent extends CustomEvent
{
    type: "change";
    target: TextEdit;
    detail: {
        text: string;
        isEditing: boolean;
    }
}

@customElement("ff-text-edit")
export default class TextEdit extends CustomElement
{
    /** Optional name to identify the button. */
    @property({ type: String })
    name = "";

    /** Optional index to identify the button. */
    @property({ type: Number })
    index = 0;

    /** Optional number to define the number of visible rows in the control. */
    @property({ type: Number })
    rows = 0;

    /** Text to be edited in the control. */
    @property({ type: String })
    text = "";

    /** Placeholder text to display if no other text is present. */
    @property({ type: String })
    placeholder = "";

    @property({ type: Boolean })
    readonly = false;

    @property({ type: String })
    align: TextAlign = "left";

    /** Max number of characters allowed in the box. 0 == unlimited. */
    @property({ type: Number })
    maxLength = 0;

    protected initialValue: string = "";

    protected get textArea() {
        return this.getElementsByTagName("textarea").item(0) as HTMLTextAreaElement;
    }

    select()
    {
        const textArea = this.textArea;
        textArea && textArea.select();
    }

    focus()
    {
        const textArea = this.textArea;
        textArea && textArea.focus();
    }

    blur()
    {
        const textArea = this.textArea;
        textArea && textArea.blur();
    }

    hasFocus()
    {
        const activeElement = document.activeElement.shadowRoot ? document.activeElement.shadowRoot.activeElement : document.activeElement;
        return this.textArea === activeElement;
    }

    protected firstConnected()
    {
        this.classList.add("ff-control", "ff-text-edit");
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
        return html`<textarea
            .value=${this.text} placeholder=${this.placeholder} rows=${this.rows} aria-labelledby=${this.getAttribute("aria-labelledby") ?? ''}
            @keydown=${this.onKeyDown} @change=${this.onChange} @input=${this.onInput}
            @focus=${this.onFocus} @blur=${this.onBlur} 
            style="text-align: ${this.align};" ?readonly=${this.readonly} maxlength=${ifDefined(this.maxLength > 0 ? this.maxLength : undefined)}}></textarea>`;
    }

    protected onKeyDown(event: KeyboardEvent)
    {
        const target = event.target as HTMLTextAreaElement;

        if (event.key === "Escape") {
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
    }

    protected onBlur(event)
    {
        this.commit(event.target);
        this.requestUpdate();
    }

    protected revert(element: HTMLTextAreaElement)
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