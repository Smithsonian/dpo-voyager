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

import "@ff/ui/Splitter";
import "@ff/ui/Button";

import "./PropertyView";

import CVCaptureTask from "../../components/CVCaptureTask";
import { TaskView, customElement, html } from "../../components/CVTask";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-capture-task-view")
export default class CaptureTaskView extends TaskView<CVCaptureTask>
{
    protected connected()
    {
        super.connected();
        this.task.outs.ready.on("value", this.onPictureTaken, this);
    }

    protected disconnected()
    {
        this.task.outs.ready.off("value", this.onPictureTaken, this);
        super.disconnected();
    }

    protected render()
    {
        /*if (!this.task.activeMeta && !this.task.activeModel) {
            return html`<div class="sv-placeholder">Please select a model or scene to take a picture</div>`;
        }*/

        if (!this.task.isActiveScene) {
            return html`<div class="sv-placeholder">Please select a scene to take a picture</div>`;
        }

        const ins = this.task.ins;
        const ready = this.task.outs.ready.value;

        const imageElement = this.task.getImageElement();
        const image = imageElement ? html`<div class="sv-label">Preview</div>
            <div class="sv-image">${imageElement}</div>` : null;

        return html`<div class="sv-label">Scene State</div>
            <div class="sv-commands">
                <ff-button text="Capture" icon="camera" @click=${this.onClickTake}></ff-button>
                <ff-button text="View" icon="document" @click=${this.onClickRestore}></ff-button>
            </div>
            <div class="sv-label">Thumbnail Images</div>
            <div class="sv-commands">
                <ff-button text="Save" icon="save" ?disabled=${!ready} @click=${this.onClickSave}></ff-button>
                <ff-button text="Download" icon="download" ?disabled=${!ready} @click=${this.onClickDownload}></ff-button>
            </div>
            <div class="ff-flex-item-stretch"><div class="ff-scroll-y ff-flex-column sv-detail-view">
                <sv-property-view .property=${ins.type}></sv-property-view>
                <sv-property-view .property=${ins.quality}></sv-property-view>
                ${image}
            </div></div>`;
    }

    protected onClickTake()
    {
        this.task.ins.take.set();
    }

    protected onClickSave()
    {
        this.task.ins.save.set();
    }

    protected onClickDownload()
    {
        this.task.ins.download.set();
    }

    protected onClickRestore()
    {
        this.task.ins.restore.set();
    }

    protected onPictureTaken()
    {
        this.requestUpdate();
    }
}
