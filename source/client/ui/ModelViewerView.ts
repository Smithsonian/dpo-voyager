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

import CVAssetManager from "../components/CVAssetManager";
import System from "@ff/graph/System";
import SystemView, { customElement, html } from "@ff/scene/ui/SystemView";
import "./Spinner";
import CVModel2 from "client/components/CVModel2";
import { EDerivativeUsage, EDerivativeQuality, EAssetType } from "client/schema/model";
import CVAnnotationView from "client/components/CVAnnotationView";
import CVDocumentProvider from "client/components/CVDocumentProvider";
import DocumentView from "./explorer/DocumentView";
import Subscriber from "@ff/core/Subscriber";
import CVDocument from "client/components/CVDocument";

////////////////////////////////////////////////////////////////////////////////

/**
 * 
 */
@customElement("sv-model-viewer-view")
export default class ModelViewerView extends DocumentView
{
    protected modelURI: string = "";
    protected annotations = null;

    protected documentProps = new Subscriber("value", this.onUpdate, this);

    constructor(system?: System)
    {
        super(system);


        const head = document.getElementsByTagName("head");
        const mv_script = document.createElement("script");
        mv_script.setAttribute("type", "module");
        mv_script.setAttribute("src", "https://unpkg.com/@google/model-viewer/dist/model-viewer.js");
        head[0].appendChild(mv_script);
    } 

    protected get assetManager() {
        return this.system.getMainComponent(CVAssetManager);
    }
    protected get documentProvider() {
        return this.system.getMainComponent(CVDocumentProvider);
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-model-viewer-view");
    }

    protected connected()
    {
        super.connected();
        this.assetManager.outs.busy.on("value", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.assetManager.outs.busy.off("value", this.performUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        const isLoading = this.assetManager.outs.busy.value;
        const annotationView = this.system.getComponents(CVAnnotationView)[0];
        const annotationsList = annotationView ? annotationView.getAnnotations() : null;

        if (this.modelURI === "") {
            const models = this.system.getComponents(CVModel2); 
            if(models.length > 0) {
                const targetQualityDerivative = models[0].derivatives.select(EDerivativeUsage.Web3D, EDerivativeQuality.High);
                const modelAsset = targetQualityDerivative.findAsset(EAssetType.Model);
                this.modelURI = this.assetManager.getAssetUrl(modelAsset.data.uri);
            }
        }

        if(this.activeDocument)
        {
            console.log("DOCUMENT");
            const viewerIns = this.activeDocument.setup.viewer.ins;
            if(viewerIns.annotationsVisible.value)
                console.log("ANNOTATIONS ON");
        }
         
        return annotationsList ? html`
                    <style>
                        button{
                        display: block;
                        width: 20px;
                        height: 20px;
                        border-radius: 10px;
                        border: none;
                        background-color: blue;
                        box-sizing: border-box;
                        }
                    
                        #annotation{
                        background-color: #888888;
                        position: absolute;
                        transform: translate(10px, 10px);
                        border-radius: 10px;
                        padding: 10px;
                        }
                        /* This keeps child nodes hidden while the element loads */
                        :not(:defined) > * {
                        display: none;
                        }
                    </style>            
                    <model-viewer src="${this.modelURI}" "alt="testtest" camera-controls style="display: block; width: 100%; height: ${document.documentElement.clientHeight}px;">
                    ${annotationsList ? annotationsList.map(annotation => html`<button slot="hotspot-${annotation.data.title}" data-position="${annotation.data.position[0]/1.0} ${annotation.data.position[1]/1.0} ${annotation.data.position[2]/1.0}" data-normal="${"0 0 -1"}"><div id="annotation">${annotation.data.title}</div></button>`) : ""}
                    </model-viewer>
                    <sv-spinner ?visible=${isLoading}></sv-spinner>` : html``;
    }


    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.documentProps.off();
        }
        if (next) {
            const setup = next.setup;

            this.documentProps.on(
                setup.viewer.ins.annotationsVisible,
            );
        }

        this.requestUpdate();
    }
}