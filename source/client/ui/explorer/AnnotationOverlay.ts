/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Popup, { customElement, html } from "@ff/ui/Popup";

import "@ff/ui/Button";
import "@ff/ui/TextEdit";
import {getFocusableElements, focusTrap} from "../../utils/focusHelpers";
import AnnotationSprite from "client/annotations/AnnotationSprite";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-annotation-overlay")
export default class AnnotationOverlay extends Popup
{
    protected content: HTMLElement = null;
    protected sprite: AnnotationSprite = null;
    protected resizeObserver: ResizeObserver = null;

    static show(parent: HTMLElement, content: HTMLElement, sprite: AnnotationSprite): Promise<void>
    {
        const popup = new AnnotationOverlay(parent, content, sprite);
        parent.appendChild(popup);

        return new Promise((resolve, reject) => {
            popup.on("close", () => resolve());
        });
    }

    constructor( parent: HTMLElement, content: HTMLElement, sprite: AnnotationSprite )
    {
        super();

        this.close = this.close.bind(this);
        this.onKeyDownMain = this.onKeyDownMain.bind(this);

        this.content = content;
        this.title = "";
        this.sprite = sprite;
        this.position = "center";
        this.portal = parent;
        this.modal = true;
    }

    close()
    {
        this.dispatchEvent(new CustomEvent("close"));
        this.remove();
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-annotation-overlay", "sv-annotation");
    }

    protected connected()
    {
        super.connected();

        this.sprite.addEventListener("link", this.close);
        
        if(!this.resizeObserver) { 
            this.resizeObserver = new ResizeObserver(() => this.onResize());
        }
        this.resizeObserver.observe(this);
    }

    protected disconnected()
    {
        this.resizeObserver.disconnect();

        this.sprite.removeEventListener("link", this.close);

        super.disconnected();
    }

    protected render()
    {
        return html`
        <div class="sv-help-region" id="anno_container" role="region" @wheel=${(e) => this.discardEvents(e)} @pointerdown=${(e) => this.discardEvents(e)} aria-label="Annotation pop-up" aria-live="polite" aria-atomic="true" @keydown=${e =>this.onKeyDownMain(e)}>
            <div class="ff-flex-row">
                <div id="ovr_title" class="ff-flex-spacer ff-title"><b>${this.title}</b></div>
                <ff-button icon="close" transparent class="ff-close-button" title="Close" @click=${this.close}></ff-button>
            </div>
        </div>
        `;
    }

    protected firstUpdated(changedProperties) {
        super.firstUpdated(changedProperties);

        (this.getElementsByClassName("ff-close-button")[0] as HTMLElement).focus();

        const annoContainer = this.querySelector("#anno_container");
        annoContainer.append(this.content);

        // Trigger screen reader update
        setTimeout(() => {this.title = this.sprite.annotation.title; this.requestUpdate();}, 100);   
    }

    protected onKeyDownMain(e: KeyboardEvent)
    {
        if (e.code === "Escape") {
            this.close();
        }
        else if(e.code === "Tab") {
            e.stopPropagation();
            focusTrap(getFocusableElements(this) as HTMLElement[], e);
        }
    }

    protected discardEvents(event: PointerEvent | WheelEvent) {
        event.stopPropagation();
    }
}
