/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-tag-cloud")
export default class TagCloud extends DocumentView
{
    protected viewer: CVViewer;

    protected firstConnected()
    {
        super.firstConnected();

        this.classList.add("sv-bottom-bar-container", "sv-tag-cloud", "sv-transition");
        setTimeout(() => this.classList.remove("sv-transition"), 1);
    }

    protected render()
    {
        const viewer = this.viewer;

        const selectedTags = viewer ? viewer.ins.selectedTags.value.split(",").map(tag => tag.trim()) : [];
        const tags = viewer ? viewer.outs.tagCloud.value.split(",").map(tag => tag.trim()) : [];

        const tagButtons = tags.map(tag =>
            html`<ff-button class="sv-tag-button" transparent text=${tag}
                ?selected=${selectedTags.indexOf(tag) >= 0}
                @click=${e => this.onSelectTag(tag)}></ff-button>`);

        return html`<div class="sv-blue-bar"><div class="sv-section">
                <ff-button class="sv-section-lead" transparent icon="comment" title="Tag Menu"></ff-button>
                <div class="sv-tag-buttons">${tagButtons}</div>
        </div></div>`;
    }

    protected onSelectTag(tag: string)
    {
        const selectedTags = this.viewer.ins.selectedTags.value.split(",").map(tag => tag.trim());
        const index = selectedTags.indexOf(tag);
        if (index > 0) {
            selectedTags.splice(index, 1);
        }
        else {
            selectedTags.push(tag);
        }

        this.viewer.ins.selectedTags.setValue(selectedTags.join(", "));
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.viewer.ins.selectedTags.off("value", this.onUpdate, this);
            this.viewer.outs.tagCloud.off("value", this.onUpdate, this);
        }
        if (next) {
            this.viewer = next.setup.viewer;
            this.viewer.ins.selectedTags.on("value", this.onUpdate, this);
            this.viewer.outs.tagCloud.on("value", this.onUpdate, this);
        }
    }
}