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

import CVTaskProvider from "../../components/CVTaskProvider";
import sanitizeHtml from 'sanitize-html';

import DocumentView, { customElement, html } from "../explorer/DocumentView";
import CVDocument from "client/components/CVDocument";
import { ILineEditChangeEvent } from "client/../../libs/ff-ui/source/LineEdit";

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
        const languageManager = this.activeDocument.setup.language;

        const meta = this.activeDocument.meta;
        let customMetas = [];
        if(meta) {
            meta.collection.ids.forEach(id => {
                if(!["title","titles","intros"].includes(id)) {
                    customMetas.push(html`<br><div class="sv-label">${id}</div>
                    <ff-line-edit name=${id} text=${meta.collection.get(id)} @change=${this.onTextEdit}></ff-line-edit>`);
                }
            })
        }

        return html`<div class="ff-scroll-y ff-flex-column" style="padding-bottom: 5px">
            <div class="sv-panel-header">
                <ff-icon name="document"></ff-icon>
                <div class="ff-text">Collection</div>
            </div>
            <sv-property-view .property=${languageManager.ins.language}></sv-property-view>
            <div class="sv-indent">
                <div class="sv-label">Title</div>
                <ff-line-edit name="title" text=${this.activeDocument.ins.title.value || "Missing Title"} @change=${this.onTextEdit}></ff-line-edit>
                <div class="sv-label">Intro</div>
                <ff-text-edit name="intro" text=${this.activeDocument.ins.intro.value} @change=${this.onTextEdit}></ff-text-edit>
            </div>
            <div class="sv-label">Copyright</div>
            <ff-line-edit name="copyright" text=${this.activeDocument.ins.copyright.value} @change=${this.onTextEdit}></ff-line-edit>
            ${customMetas}
        </div>`;
    }

    protected onTextEdit(event: ILineEditChangeEvent)
    {
        const activeDoc = this.activeDocument;

        if (activeDoc) {
            const target = event.target;
            const text = event.detail.text;

            if (target.name === "title") {
                activeDoc.ins.title.setValue(sanitizeHtml(text,
                    {
                        allowedTags: [ 'i' ]
                    }    
                ));
            }
            else if (target.name === "intro") {
                activeDoc.ins.intro.setValue(sanitizeHtml(text,
                    {
                        allowedTags: [ 'i','b','p' ]
                    }    
                ));
            }
            else if (target.name === "copyright") {
                activeDoc.ins.copyright.setValue(sanitizeHtml(text,
                    {
                        allowedTags: [ 'i','b','a' ]
                    }
                ));
            
            }
            else {
                // assign value from custom field
                this.activeDocument.meta.collection.insert(text,target.name);
            }
        }
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            previous.setup.language.outs.language.off("value", this.onUpdate, this);
            previous.outs.title.off("value", this.onUpdate, this);
            previous.outs.intro.off("value", this.onUpdate, this);
        }
        if (next) {
            next.outs.title.on("value", this.onUpdate, this);
            next.outs.intro.on("value", this.onUpdate, this);
            next.setup.language.outs.language.on("value", this.onUpdate, this);
        }
    }
}