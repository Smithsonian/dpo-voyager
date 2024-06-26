/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import "./Icon";
import "./Button";

import DockPanel from "./DockPanel";
import DockStack from "./DockStack";
import DockView from "./DockView";

import CustomElement, { customElement, html, property, PropertyValues } from "./CustomElement";

////////////////////////////////////////////////////////////////////////////////

export interface IDockPanelCloseEvent extends CustomEvent {
    detail: {
        panelId: string;
    }
}

@customElement("ff-dock-panel-header")
export default class DockPanelHeader extends CustomElement
{
    static readonly closeEvent: string = "ff-dock-panel-header-close";

    @property({ type: Boolean, reflect: true })
    active = false;

    readonly panel: DockPanel;

    constructor(panel: DockPanel)
    {
        super();

        this.onDragStart = this.onDragStart.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);
        this.onDrop = this.onDrop.bind(this);

        this.addEventListener("click", this.onClick);
        this.addEventListener("dragstart", this.onDragStart);
        this.addEventListener("dragover", this.onDragOver);
        this.addEventListener("dragleave", this.onDragLeave);
        this.addEventListener("drop", this.onDrop);

        this.panel = panel;
        panel.header = this;
    }

    protected update(changedProperties: PropertyValues)
    {
        super.update(changedProperties);

        if (this.panel.movable) {
            this.setAttribute("draggable", "true");
        }
        else {
            this.removeAttribute("draggable");
        }


        if (changedProperties.has("active")) {
            this.panel.active = this.active;
        }
    }

    protected render()
    {
        const {
            text,
            closable,
            movable
        } = this.panel;

        let icon = closable
            ? html`<ff-button inline icon="close" @click=${this.onClickButton}></ff-button>`
            : (movable ? html`<ff-icon name="grip"></ff-icon>` : null);

        return html`
            <label class="ff-text">${text}</label>
            ${icon}
        `;
    }

    protected firstUpdated()
    {
        this.setStyle({
            flex: "0 0 auto",
            display: "block",
            userSelect: "none",
            cursor: "pointer"
        });
    }

    protected onClick(event: MouseEvent)
    {
        this.panel.activatePanel();

        this.dispatchEvent(new CustomEvent(DockView.changeEvent, { bubbles: true }));
    }

    protected onClickButton(event: MouseEvent)
    {
        this.dispatchEvent(new CustomEvent(DockPanelHeader.closeEvent, {
            detail: { panelId: this.panel.id },
            bubbles: true
        } as IDockPanelCloseEvent));

        this.panel.closePanel();
        event.stopPropagation();

        this.dispatchEvent(new CustomEvent(DockView.changeEvent, { bubbles: true }));
    }

    protected onDragStart(event: DragEvent)
    {
        // activate panel
        const stack = this.panel.parentElement as DockStack;
        stack.activatePanel(this.panel);

        event.dataTransfer.setData(DockPanel.dragDropMimeType, this.panel.id);
        event.dataTransfer.dropEffect = "move";
    }

    protected onDragOver(event: DragEvent)
    {
        this.panel.parentStack.onDragOver(event);
    }

    protected onDragLeave(event: DragEvent)
    {
        this.panel.parentStack.onDragLeave(event);
    }

    protected onDrop(event: DragEvent)
    {
        this.panel.parentStack.onDrop(event);
    }
}
