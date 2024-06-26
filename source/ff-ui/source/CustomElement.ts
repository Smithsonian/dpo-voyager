/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { TypeOf, Dictionary } from "@ff/core/types";
import { LitElement } from "lit-element";

////////////////////////////////////////////////////////////////////////////////

export { property, PropertyValues } from "lit-element";
export { html, svg, render, TemplateResult } from "lit-html";
export { repeat } from "lit-html/directives/repeat";

@customElement("ff-custom-element")
export default class CustomElement extends LitElement
{
    static readonly tagName: string = "ff-custom-element";
    static readonly shady: boolean = false;

    private _isFirstConnected = false;

    static setStyle(element: HTMLElement, style: Partial<CSSStyleDeclaration>)
    {
        Object.assign(element.style, style);
    }

    static setAttribs(element: HTMLElement, attribs: Dictionary<string>)
    {
        for (let name in attribs) {
            element.setAttribute(name, attribs[name]);
        }
    }

    get shady()
    {
        return (this.constructor as typeof CustomElement).shady;
    }

    appendTo(parent: Element): this
    {
        parent.appendChild(this);
        return this;
    }

    removeChildren()
    {
        while(this.firstChild) {
            this.removeChild(this.firstChild);
        }
    }

    getChildrenArray()
    {
        return Array.from(this.children);
    }

    appendElement<T extends HTMLElement>(
        type: TypeOf<T> | T, style?: Partial<CSSStyleDeclaration>): T;

    appendElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K, style?: Partial<CSSStyleDeclaration>): HTMLElementTagNameMap[K];

    appendElement(tagOrType, style)
    {
        return this.createElement(tagOrType, style, this);
    }

    createElement<T extends HTMLElement>(
        type: TypeOf<T> | T, style?: Partial<CSSStyleDeclaration>, parent?: Element): T;

    createElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K, style?: Partial<CSSStyleDeclaration>, parent?: Element): HTMLElementTagNameMap[K];

    createElement(tagOrType, style, parent)
    {
        let element;

        if (typeof tagOrType === "string") {
            element = document.createElement(tagOrType);
        }
        else if (tagOrType instanceof HTMLElement) {
            element = tagOrType;
        }
        else {
            element = new tagOrType();
        }

        if (style) {
            Object.assign(element.style, style);
        }
        if (parent) {
            parent.appendChild(element);
        }

        return element;
    }

    setStyle(style: Partial<CSSStyleDeclaration>): this
    {
        CustomElement.setStyle(this, style);
        return this;
    }

    setAttribute(name: string, value: string)
    {
        super.setAttribute(name, value);
        return this;
    }

    setAttributes(attribs: Dictionary<string>): this
    {
        CustomElement.setAttribs(this, attribs);
        return this;
    }

    addClass(...classes: string[]): this
    {
        classes.forEach(klass => this.classList.add(klass));
        return this;
    }

    removeClass(...classes: string[]): this
    {
        classes.forEach(klass => this.classList.remove(klass));
        return this;
    }

    setClass(name: string, state: boolean): this
    {
        if (state) {
            this.classList.add(name);
        }
        else {
            this.classList.remove(name);
        }

        return this;
    }

    hasFocus()
    {
        return document.activeElement === this;
    }

    on<T extends Event>(type: string, listener: (event: T) => any, options?: boolean | AddEventListenerOptions)
    {
        this.addEventListener(type, listener, options);
        return this;
    }

    off<T extends Event>(type: string, listener: (event: T) => any, options?: boolean | AddEventListenerOptions)
    {
        this.removeEventListener(type, listener, options);
        return this;
    }

    connectedCallback()
    {
        if (!this._isFirstConnected) {
            this._isFirstConnected = true;
            this.firstConnected();
        }

        this.connected();

        super.connectedCallback();
    }

    disconnectedCallback()
    {
        super.disconnectedCallback();
        this.disconnected();
    }

    protected createRenderRoot()
    {
        return this.shady ? super.createRenderRoot() : this;
    }

    protected firstConnected()
    {
    }

    protected connected()
    {
    }

    protected disconnected()
    {
    }

    protected onUpdate()
    {
        this.requestUpdate();
    }
}

export function customElement<T extends CustomElement>(tagName?: string)
{
    return <T extends CustomElement>(constructor: TypeOf<T>) => {
        (constructor as any).tagName = tagName;
        customElements.define((constructor as any).tagName, constructor);
        return constructor as any;
    }
}