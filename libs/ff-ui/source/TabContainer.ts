/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CustomElement, { customElement, property, PropertyValues } from "./CustomElement";
import TabItem, { TabHeader } from "./TabItem";

////////////////////////////////////////////////////////////////////////////////

@customElement("ff-tab-container")
export default class TabContainer extends CustomElement
{
    @property({ type: Number, reflect: true })
    activeIndex = 0;

    protected headers: HTMLHeadElement;
    protected activeHeader: TabHeader = null;
    protected observer = new MutationObserver(this.onObserver);
    protected firstUpdate = true;

    constructor()
    {
        super();

        this.onObserver = this.onObserver.bind(this);
        this.onTabClick = this.onTabClick.bind(this);
    }

    protected firstUpdated()
    {
        this.setStyle({
            display: "flex",
            flexDirection: "column"
        });

        // container element for tab headers
        this.headers = document.createElement("header");
        const style = this.headers.style;
        style.flex = "0 0 auto";
        style.display = "flex";
        this.insertBefore(this.headers, this.firstChild);
    }

    protected connected()
    {
        this.observer.observe(this, { childList: true });
    }

    protected disconnected()
    {
        this.observer.disconnect();
    }

    protected update(changedProperties: PropertyValues)
    {
        super.update(changedProperties);

        if (this.firstUpdate) {
            this.firstUpdate = false;
            this.updateTabs();
        }

        // update active tab
        let index = 0;
        for (let child of this.headers.children) {
            const header = child as TabHeader;
            if (index === this.activeIndex) {
                header.active = true;
                this.activeHeader = header;
            }
            else {
                header.active = false;
            }
            index++;
        }
    }

    protected updateTabs()
    {
        // ensure headers come first
        if (this.headers !== this.firstChild) {
            this.insertBefore(this.headers, this.firstChild);
        }

        // remove all header elements
        while(this.headers.firstChild) {
            this.headers.removeChild(this.headers.firstChild);
        }

        // ensure all tab items have a header
        const children = Array.from(this.children);
        children.forEach(child => {
            if (child === this.headers) {
                return;
            }
            if (child instanceof TabItem) {
                if (!child.header) {
                    child.header = new TabHeader(child);
                    child.header.addEventListener("click", this.onTabClick);
                }
                this.headers.appendChild(child.header);
            }
            else {
                this.removeChild(child);
                return;
            }
        });
    }

    protected onObserver(mutations)
    {
        mutations.forEach(mutation => {
            if (mutation.type === "childList") {
                this.updateTabs();
            }
        });
    }

    protected onTabClick(event: MouseEvent)
    {
        this.activeHeader.active = false;
        const header = event.currentTarget as TabHeader;
        header.active = true;
        this.activeHeader = header;

        // update activeIndex property
        let index = 0;
        for (let child of this.headers.children) {
            if (child === this.activeHeader) {
                this.activeIndex = index;
                break;
            }
            index++;
        }
    }
}

