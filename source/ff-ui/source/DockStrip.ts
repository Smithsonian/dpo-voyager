/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CustomElement, { customElement, property, PropertyValues } from "./CustomElement";

import Splitter, { ISplitterChangeEvent, SplitterDirection } from "./Splitter";
import { DockContentRegistry } from "./DockView";
import DockStack, { IDockStackLayout } from "./DockStack";
import DockPanel, { DropZone } from "./DockPanel";
import DockView from "./DockView";

////////////////////////////////////////////////////////////////////////////////

export interface IDockStripLayout
{
    type: "strip";
    size: number;
    direction: SplitterDirection;
    elements: IDockElementLayout[];
}

export type DockElement = DockStrip | DockStack;
export type IDockElementLayout = IDockStripLayout | IDockStackLayout;

const _isDockElement = e => e instanceof DockStrip || e instanceof DockStack;


@customElement("ff-dock-strip")
export default class DockStrip extends CustomElement
{
    @property({ type: Number })
    get size() {
        //console.trace("DockStrip.size GET", this.style.flexBasis);
        return parseFloat(this.style.flexBasis) * 0.01;
    }
    set size(value: number) {
        this.style.flexBasis = `${((value || 1) * 100).toFixed(3)}%`;
        //console.trace("DockStrip.size SET", this.style.flexBasis);
    }

    @property({ type: String })
    direction: SplitterDirection = "horizontal";

    protected isInit = false;


    insertPanel(panel: DockPanel, stack: DockStack, zone: DropZone)
    {
        const zoneDirection = (zone === "left" || zone === "right") ? "horizontal" : "vertical";
        const zoneBefore = zone === "left" || zone === "top";
        const stackSize = stack.size;

        // wrap panel in new stack
        const newStack = new DockStack();
        newStack.insertPanel(panel);
        newStack.activatePanel(panel);

        // if there is less than two elements in this strip, we can adapt direction
        const elements = this.getDockElements();
        if (elements.length < 2) {
            this.direction = zoneDirection;
        }

        let insertBefore: DockElement = stack;
        if (!zoneBefore) {
            for (let i = 0, n = elements.length; i < n; ++i) {
                if (elements[i] === stack) {
                    insertBefore = elements[i + 1] as DockElement;
                    break;
                }
            }
        }

        if (zoneDirection === this.direction) {
            // direction matches, insert new stack into strip
            this.insertDockElement(newStack, insertBefore);
            newStack.size = stack.size = stackSize * 0.5;
        }
        else {
            // create new strip in orthogonal direction, insert stack into new strip
            const newStrip = new DockStrip();
            this.insertBefore(newStrip, stack);
            newStrip.appendChild(stack);
            newStrip.insertDockElement(newStack, zoneBefore ? stack : null);

            newStrip.direction = zoneDirection;
            newStrip.size = stackSize;
            stack.size = newStack.size = 0.5;
        }
    }

    insertDockElement(element: DockElement, before?: DockElement)
    {
        this.init(false);
        this.insertBefore(element, before);
        this.updateSplitters();
    }

    removeDockElement(element: DockElement)
    {
        let children = this.getDockElements();
        if (children.length === 1) {
            return;
        }

        // remove the element and get remaining elements
        this.removeChild(element);

        // if only one element remains and parent is also a dock strip, merge with parent
        children = this.getDockElements();
        if (children.length < 2 && this.parentElement instanceof DockStrip) {
            const parentStrip = this.parentElement;
            const remainingElement = children[0] as DockElement;
            this.removeChild(remainingElement);

            remainingElement.size = this.size;
            parentStrip.insertBefore(remainingElement, this);
            parentStrip.removeChild(this);
            parentStrip.updateSplitters();
        }
        else {
            this.updateSplitters();
        }
    }

    getDockElements()
    {
        return Array.from(this.children).filter(_isDockElement);
    }

    setLayout(layout: IDockStripLayout, registry: DockContentRegistry)
    {
        this.init(false);

        // remove all children
        while(this.firstChild) {
            this.removeChild(this.firstChild);
        }

        this.size = layout.size;
        this.direction = layout.direction;

        layout.elements.forEach((elementLayout, index) => {
            let element;

            switch(elementLayout.type) {
                case "strip":
                    element = new DockStrip();
                    break;
                case "stack":
                    element = new DockStack();
                    break;
            }

            element.setLayout(elementLayout, registry);
            this.appendChild(element);
        });

        this.updateSplitters();
    }

    getLayout(): IDockStripLayout
    {
        const elements: any = Array.from(this.children)
            .filter(_isDockElement)
            .map((element: DockElement) => element.getLayout());

        return {
            type: "strip",
            size: this.size,
            direction: this.direction,
            elements
        };
    }

    isHorizontal()
    {
        return this.direction === "horizontal";
    }

    protected onSplitterChange(event: ISplitterChangeEvent)
    {
        if (!event.detail.isDragging) {
            this.dispatchEvent(new CustomEvent(DockView.changeEvent, { bubbles: true }));
        }
    }

    protected firstConnected()
    {
        this.init(true);
    }

    protected update(changedProperties: PropertyValues)
    {
        super.update(changedProperties);

        if (changedProperties.has("direction")) {
            this.style.flexDirection = this.isHorizontal() ? "row" : "column";
            this.updateSplitters();
        }
    }

    protected updateSplitters()
    {
        const children = this.getChildrenArray();
        const parent = this.parentElement;

        if (!parent) {
            return;
        }

        const isHorizontal = this.isHorizontal();

        const dockElements = [];
        const elementSizes = [];
        let childrenSize = 0;

        for (let i = 0, n = children.length; i < n; ++i) {
            const child = children[i];
            const nextChild = child.nextElementSibling;

            // remove redundant splitter handles
            if (child instanceof Splitter) {
                if (i === 0 || !nextChild || nextChild instanceof Splitter) {
                    this.removeChild(child);
                    continue;
                }

                child.direction = this.direction;
            }


            if (!_isDockElement(child)) {
                continue;
            }

            // sum size of children
            const childRect = child.getBoundingClientRect();
            const childSize = isHorizontal ? childRect.width : childRect.height;
            childrenSize += childSize;
            dockElements.push(child);
            elementSizes.push(childSize);

            // add splitter between previous and this child if necessary
            const prevChild = child.previousElementSibling;
            if (prevChild && !(prevChild instanceof Splitter)) {
                const splitter = new Splitter();
                splitter.direction = this.direction;
                splitter.addEventListener(Splitter.changeEvent, this.onSplitterChange);
                this.insertBefore(splitter, child);
            }
        }

        // adjust sizes
        for (let i = 0, n = dockElements.length; i < n; ++i) {
            //const prev = dockElements[i].style.flexBasis;
            dockElements[i].style.flexBasis = `${(elementSizes[i] / childrenSize * 100).toFixed(3)}%`;
            //console.log(`updateSplitters, i=${i}, prev=${prev} new=${dockElements[i].style.flexBasis}`);
        }

        // log strip configuration
        // const currentChildren = this.getChildrenArray();
        // console.log("DockStrip.updateSplitters");
        // currentChildren.forEach(child => {
        //     const size = child["style"].flexBasis;
        //     const direction = child["direction"];
        //     console.log("   %s (%s)", child.tagName, size || direction)
        // });
    }

    protected init(parseChildren: boolean)
    {
        if (this.isInit) {
            return;
        }

        this.isInit = true;

        this.setStyle({
            flex: "1 1 auto",
            display: "flex",
            alignItems: "stretch",
            overflow: "hidden"
        });

        if (parseChildren) {
            // parse children and wrap them in dock stack elements
            Array.from(this.children).forEach(child => {
                if (!_isDockElement(child)) {
                    const stack = new DockStack();
                    const nextSibling = child.nextSibling;
                    stack.appendChild(child);
                    this.insertBefore(stack, nextSibling);
                }
            });
        }
    }
}