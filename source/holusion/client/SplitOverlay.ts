
import Subscriber from "@ff/core/Subscriber";
import { System } from "@ff/scene/ui/SystemView";

import DocumentView, { customElement, html } from "client/ui/explorer/DocumentView";
import CVDocument from "client/components/CVDocument";
import CVViewer from "client/components/CVViewer";


@customElement("split-overlay")
export default class SplitOverlay extends DocumentView
{
    protected documentProps = new Subscriber("value", this.onUpdate, this);

    protected get viewer()
    {
        return this.system.getComponent(CVViewer, true);
    }
    
    constructor(system :System)
    {
        super(system);
    }
    
    protected firstConnected(): void 
    {
        this.classList.add("split-overlay");
    }

    protected updated():void
    {
        this.classList.add("animation");
    }

    protected render()
    {
        const document = this.activeDocument;

        return html`<div class="title">
            <h2>${document.ins.title.value}</h2>
        </div>`;
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.documentProps.off();
        }
        if (next) {
            this.documentProps.on(
                next.outs.title,
            );
        }
        this.classList.remove("animation");
        this.requestUpdate();
    }
}