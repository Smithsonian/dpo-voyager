/**
 * 3D Foundation Project
 * Copyright 2020 Smithsonian Institution
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

import CVTaskProvider from "../../components/CVTaskProvider";

import DocumentView, { customElement, html } from "../explorer/DocumentView";
import CVDocument from "client/components/CVDocument";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-collection-panel")
export default class CollectionPanel extends DocumentView
{
    protected get taskProvider() {
        return this.system.getMainComponent(CVTaskProvider);
    }

    protected firstConnected()
    {
        this.classList.add("sv-panel", "sv-collection-panel");
    }

    protected render()
    {
        return html`<div class="sv-panel-header">
                <ff-icon name="document"></ff-icon>
                <div class="ff-text">Collection</div>
            </div>
            <sv-property-view .property=${this.taskProvider.ins.language}></sv-property-view>
            <div class="sv-indent">
                <sv-property-view .property=${this.activeDocument.ins.title}></sv-property-view>
            </div>`;
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            previous.setup.language.outs.language.off("value", this.onUpdate, this);
        }
        if (next) {
            next.setup.language.outs.language.on("value", this.onUpdate, this);
        }
    }
}