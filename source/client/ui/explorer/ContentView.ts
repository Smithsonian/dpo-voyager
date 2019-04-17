/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
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

import Subscriber from "@ff/core/Subscriber";

import { EReaderPosition } from "common/types/setup";

import CVAssetReader from "../../components/CVAssetReader";
import CVDocument from "../../components/CVDocument";

import SceneView from "../SceneView";
import "../Spinner";
import "./ReaderView";

import DocumentView, { customElement, html } from "./DocumentView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-content-view")
export default class ContentView extends DocumentView
{
    protected sceneView: SceneView = null;
    protected documentProps = new Subscriber("value", this.onUpdate, this);

    protected get assetLoader() {
        return this.system.getMainComponent(CVAssetReader);
    }
    protected get reader() {
        return this.activeDocument ? this.activeDocument.setup.reader : null;
    }
    protected get tours() {
        return this.activeDocument ? this.activeDocument.setup.tours : null;
    }

    protected firstConnected()
    {
        this.classList.add("sv-content-view");
        this.sceneView = new SceneView(this.system);
    }

    protected connected()
    {
        super.connected();
        this.assetLoader.outs.busy.on("value", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.assetLoader.outs.busy.off("value", this.performUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        const system = this.system;
        const isLoading = this.assetLoader.outs.busy.value;

        let readerVisible = false;
        let readerPosition = EReaderPosition.Overlay;
        let tourMenuVisible = false;

        const reader = this.reader;
        const tours = this.tours;

        if (tours) {
            tourMenuVisible = tours.ins.enabled.value && tours.outs.tourIndex.value === -1;
        }
        if (reader) {
            readerVisible = ! tourMenuVisible && reader.ins.enabled.value;
            readerPosition = reader.ins.position.value;
        }

        const sceneView = this.sceneView;

        const blurContent =
            (readerVisible && readerPosition === EReaderPosition.Overlay) || tourMenuVisible;

        if (!blurContent) {
            sceneView.classList.remove("sv-blur");
        }
        else {
            setTimeout(() => sceneView.classList.add("sv-blur"), 1);
        }

        if (readerVisible) {
            if (readerPosition === EReaderPosition.Right) {
                return html`<div class="ff-fullsize sv-content-split">
                    ${sceneView}
                    <ff-splitter direction="horizontal"></ff-splitter>
                    <sv-reader-view .system=${system} class="sv-reader-split"></sv-reader-view></div>
                    <sv-spinner ?visible=${isLoading}></sv-spinner>`;
            }
            if (readerPosition === EReaderPosition.Overlay) {
                return html`<div class="ff-fullsize sv-content-stack">${sceneView}
                    <div class="sv-reader-container">
                        <sv-reader-view .system=${system} @close=${this.onReaderClose}></sv-reader-view>
                    </div>
                    <sv-spinner ?visible=${isLoading}></sv-spinner></div>`;
            }
        }

        return html`<div class="ff-fullsize sv-content-only">${sceneView}</div>
            <sv-spinner ?visible=${isLoading}></sv-spinner>`;
    }

    protected onReaderClose()
    {
        this.reader.ins.enabled.setValue(false);
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.documentProps.off();
        }
        if (next) {
            this.documentProps.on(
                next.setup.reader.ins.position,
                next.setup.reader.ins.enabled,
                next.setup.tours.outs.tourIndex,
            );
        }

        this.requestUpdate();
    }
}

