/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */


import uniqueId from "@ff/core/uniqueId";

import CustomElement, { customElement, property, PropertyValues } from "./CustomElement";
import { DockContentRegistry } from "./DockView";
import DockStack from "./DockStack";
import DockStrip from "./DockStrip";
import DockPanelHeader from "./DockPanelHeader";
import DockView from "./DockView";

////////////////////////////////////////////////////////////////////////////////

export type DropZone = "none" | "before" | "after" | "left" | "right" | "top" | "bottom";

export interface IDockPanelLayout
{
    contentId: string;
    text?: string;
    closable?: boolean;
    movable?: boolean;
}

@customElement("ff-dock-panel")
export default class DockPanel extends CustomElement
{
    static readonly dragDropMimeType: string = "application/x-ff-dock-panel";

    static getPanelById(id: string): DockPanel
    {
        return document.getElementById(id) as DockPanel;
    }


    @property({ type: String })
    text: string = "Panel";

    @property({ type: Boolean })
    closable: boolean = true;

    @property({ type: Boolean })
    movable: boolean = true;

    @property({ type: Boolean, reflect: true })
    active: boolean = false;

    header: DockPanelHeader = null;

    protected contentId: string;
    protected dropZone: DropZone;

    constructor()
    {
        super();

        this.onDragOver = this.onDragOver.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);
        this.onDrop = this.onDrop.bind(this);

        this.addEventListener("dragover", this.onDragOver);
        this.addEventListener("dragleave", this.onDragLeave);
        this.addEventListener("drop", this.onDrop);

        this.id = uniqueId();
        this.contentId = "";
        this.dropZone = "none";
    }

    get parentStack(): DockStack
    {
        return this.parentElement as DockStack;
    }

    setLayout(layout: IDockPanelLayout, registry: DockContentRegistry)
    {
        this.text = layout.text || "";
        this.closable = layout.closable || false;
        this.movable = layout.movable || false;
        this.contentId = layout.contentId;

        const factory = registry.get(layout.contentId);
        if (!factory) {
            console.warn(`failed to create content element for id: ${layout.contentId}`);
        }
        else {
            const contentElement = factory();
            contentElement.classList.add("ff-fullsize");
            this.appendChild(contentElement);
        }
    }

    getLayout(): IDockPanelLayout
    {
        return {
            contentId: this.contentId,
            text: this.text,
            closable: this.closable,
            movable: this.movable
        };
    }

    movePanel(originPanelId: string, zone: DropZone)
    {
        const panel = DockPanel.getPanelById(originPanelId);
        const originStack = panel.parentStack;

        if (panel === this && originStack.getPanelCount() === 1) {
            return;
        }

        const stack = this.parentStack;

        if (zone === "before" || zone === "after") {
            if (panel === this) {
                return;
            }

            let anchorPanel: DockPanel = this;
            if (zone === "after") {
                const nextHeader = this.header.nextElementSibling as DockPanelHeader;
                anchorPanel = nextHeader ? nextHeader.panel : null;
            }

            if (panel === anchorPanel) {
                return;
            }

            originStack.removePanel(panel);
            stack.insertPanel(panel, anchorPanel);
            stack.activatePanel(panel);
        }
        else {
            originStack.removePanel(panel);
            const parentStrip = stack.parentElement as DockStrip;
            parentStrip.insertPanel(panel, stack, zone);
        }

        // panel configuration has changed, send global resize event so components can adjust to new size
        setTimeout(() => window.dispatchEvent(new CustomEvent("resize")), 0);
    }

    activatePanel()
    {
        this.parentStack.activatePanel(this);
    }

    closePanel()
    {
        this.parentStack.removePanel(this);

        // panel configuration has changed, send global resize event so components can adjust to new size
        setTimeout(() => window.dispatchEvent(new CustomEvent("resize")), 0);
    }

    protected update(changedProperties: PropertyValues)
    {
        super.update(changedProperties);

        if (this.header) {
            this.header.requestUpdate();
        }

        if (changedProperties.has("active")) {
            this.style.display = this.active ? "flex" : "none";
        }
    }

    protected firstUpdated()
    {
        this.setStyle({
            flex: "1 1 100%",
            position: "relative",
            flexDirection: "column",
            boxSizing: "border-box",
            overflow: "hidden"
        });
    }

    protected onDragOver(event: DragEvent)
    {
        const items = Array.from(event.dataTransfer.items);
        if (items.find(item => item.type === DockPanel.dragDropMimeType)) {
            const dropZone = this.getDropZone(event);
            if (dropZone !== this.dropZone) {
                this.dropZone = dropZone;
                this.updateDropMarker();
            }

            event.stopPropagation();
            event.preventDefault();
        }
    }

    protected onDragLeave(event: DragEvent)
    {
        if (this.dropZone !== "none") {
            this.dropZone = "none";
            this.updateDropMarker();
        }
    }

    protected onDrop(event: DragEvent)
    {
        const items = Array.from(event.dataTransfer.items);
        if (items.find(item => item.type === DockPanel.dragDropMimeType)) {

            const zone = this.dropZone;

            if (zone !== "none") {
                this.dropZone = "none";
                this.updateDropMarker();
            }

            event.stopPropagation();

            const panelId = event.dataTransfer.getData(DockPanel.dragDropMimeType);
            this.movePanel(panelId, zone);

            this.dispatchEvent(new CustomEvent(DockView.changeEvent, { bubbles: true }));
        }
    }

    protected getDropZone(event: DragEvent): DropZone
    {
        const rect = this.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        let zone: DropZone;

        if (x > 0.33 && x < 0.67 && y > 0.33 && y < 0.67) {
            zone = "after";
        }
        else if (x < y) {
            zone = (x + y < 1) ? "left" : "bottom";
        }
        else {
            zone = (x + y < 1) ? "top" : "right";
        }

        return zone;
    }

    protected updateDropMarker()
    {
        const zone = this.dropZone;

        let marker = this.getElementsByClassName("ff-dock-drop-marker").item(0) as HTMLDivElement;

        if (marker && zone === "none") {
            this.removeChild(marker);
            return;
        }

        if (!marker) {
            marker = document.createElement("div");
            marker.classList.add("ff-dock-drop-marker");
            this.appendChild(marker);
        }

        const style = marker.style;
        style.pointerEvents = "none";
        style.zIndex = "1";
        style.position = "absolute";
        style.left = "0"; style.right = "0";
        style.top = "0"; style.bottom = "0";

        switch(zone) {
            case "left":
                style.right = "50%";
                break;
            case "right":
                style.left = "50%";
                break;
            case "top":
                style.bottom = "50%";
                break;
            case "bottom":
                style.top = "50%";
                break;
        }
    }
}
