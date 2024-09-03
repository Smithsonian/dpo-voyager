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

import "@ff/ui/Button";

import CVDocument from "../../components/CVDocument";
import CVViewer from "../../components/CVViewer";

import DocumentView, { customElement, html } from "./DocumentView";
import {getFocusableElements, focusTrap} from "../../utils/focusHelpers";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-tag-cloud")
export default class TagCloud extends DocumentView
{
    protected viewer: CVViewer;

    protected get activeTags() {
        return this.viewer ? this.viewer.ins.activeTags.value.split(",")
            .map(tag => tag.trim()).filter(tag => !!tag) : [];
    }

    protected get tagCloud() {
        return this.viewer ? this.viewer.outs.tagCloud.value.split(",")
            .map(tag => tag.trim()).filter(tag => !!tag) : [];
    }

    protected firstConnected()
    {
        super.firstConnected();

        this.classList.add("sv-bottom-bar-container", "sv-tag-cloud", "sv-transition");
        setTimeout(() => this.classList.remove("sv-transition"), 1);
    }

    protected render()
    {
        const activeTags = this.activeTags;
        const tagCloud = this.tagCloud;

        const tagButtons = tagCloud.map(tag =>
            html`<ff-button class="sv-tag-button" transparent text=${tag}
                ?selected=${activeTags.indexOf(tag) >= 0}
                @click=${e => this.onSelectTag(tag)}></ff-button>`);

        return html`<div class="sv-blue-bar" @keydown=${this.onKeyDown} role="region" aria-label="Tag Cloud Menu"><div class="sv-section">
                <ff-button class="sv-section-lead" transparent icon="close" title="Close Tag Menu" @click=${this.onClickClose}></ff-button>
                <div class="sv-tag-buttons">${tagButtons}</div>
        </div></div>`;
    }

    protected onClickClose()
    {
        this.viewer.ins.annotationsVisible.setValue(false);
        this.viewer.ins.annotationExit.set();
    }

    protected onSelectTag(tag: string)
    {
        let activeTags = this.activeTags;
        const radioTags = this.viewer.ins.radioTags.value;

        const index = activeTags.indexOf(tag);

        if (index >= 0 && !radioTags) {
            activeTags.splice(index, 1);
        }
        else if (index < 0) {
            if (radioTags) {
                activeTags = [ tag ];
            }
            else {
                activeTags.push(tag);
            }
        }

        this.viewer.ins.annotationFocus.setValue(true);
        this.viewer.ins.activeTags.setValue(activeTags.join(", "));
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.viewer.ins.activeTags.off("value", this.onUpdate, this);
            this.viewer.outs.tagCloud.off("value", this.onUpdate, this);
        }
        if (next) {
            this.viewer = next.setup.viewer;
            this.viewer.ins.activeTags.on("value", this.onUpdate, this);
            this.viewer.outs.tagCloud.on("value", this.onUpdate, this);
        }
    }

    protected onKeyDown(e: KeyboardEvent)
    {
        if (e.code === "Escape") {
            e.preventDefault();
            this.onClickClose();
        }
        else if(e.code === "Tab") {
            focusTrap(getFocusableElements(this) as HTMLElement[], e);
        }
    }
}