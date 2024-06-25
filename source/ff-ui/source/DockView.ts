/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CustomElement, { customElement } from "./CustomElement";
import DockStrip, { IDockElementLayout } from "./DockStrip";
import DockStack from "./DockStack";
import DockPanel from "./DockPanel";

////////////////////////////////////////////////////////////////////////////////

export { IDockElementLayout };

export type DockContentRegistry = Map<string, () => HTMLElement>;

@customElement("ff-dock-view")
export default class DockView extends CustomElement
{
    static readonly changeEvent: string = "ff-dock-view-change";

    setPanelsMovable(state: boolean)
    {
        const elements = this.getElementsByTagName(DockPanel.tagName);
        for (let element of elements) {
            (element as DockPanel).movable = state;
        }
    }

    setPanelsClosable(state: boolean)
    {
        const elements = this.getElementsByTagName(DockPanel.tagName);
        for (let element of elements) {
            (element as DockPanel).closable = state;
        }
    }

    setLayout(layout: IDockElementLayout, registry: DockContentRegistry)
    {
        // remove all children
        while(this.firstChild) {
            this.removeChild(this.firstChild);
        }

        let element;

        switch(layout.type) {
            case "strip":
                element = new DockStrip();
                break;
            case "stack":
                element = new DockStack();
                break;
       }

       element.setLayout(layout, registry);
       this.appendChild(element);

        // panel configuration has changed, send global resize event so components can adjust to new size
        setTimeout(() => window.dispatchEvent(new CustomEvent("resize")), 0);
    }

    getLayout(): IDockElementLayout | null
    {
        const element = this.firstChild;
        if (element && (element instanceof DockStrip || element instanceof DockStack)) {
            return element.getLayout() as any;
        }

        return null;
    }

    protected firstConnected()
    {
        this.setStyle({
            display: "flex",
            alignItems: "stretch"
        });
    }
}