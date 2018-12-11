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

import parseUrlParameter from "@ff/browser/parseUrlParameter";
import CustomElement, { customElement, property, PropertyValues } from "@ff/ui/CustomElement";

import ContentLayer from "./ui/ContentLayer";
import ChromeLayer from "./ui/ChromeLayer";
import ExplorerApplication from "./ExplorerApplication";

import "./ui/styles.scss";

////////////////////////////////////////////////////////////////////////////////

@customElement("voyager-explorer")
export default class ExplorerView extends CustomElement
{
    @property({ type: Boolean })
    parseUrl = true;

    @property({ type: String })
    item = "";

    @property({ type: String })
    presentation = "";

    @property({ type: String })
    template = "";

    @property({ type: String })
    model = "";

    @property({ type: String })
    geometry = "";

    @property({ type: String })
    texture = "";

    readonly application: ExplorerApplication;

    constructor(application?: ExplorerApplication)
    {
        super();

        this.application = application || new ExplorerApplication();
    }

    protected firstUpdated(changedProperties: PropertyValues)
    {
        const application = this.application;

        let presentationUrl, itemUrl, templateUrl, modelUrl, geometryUrl, textureUrl, qualityText;

        if (this.parseUrl) {
            presentationUrl = parseUrlParameter("presentation") || parseUrlParameter("p");
            itemUrl = parseUrlParameter("item") || parseUrlParameter("i");
            templateUrl = parseUrlParameter("template") || parseUrlParameter("t");
            modelUrl = parseUrlParameter("model") || parseUrlParameter("m");
            geometryUrl = parseUrlParameter("geometry") || parseUrlParameter("g");
            textureUrl = parseUrlParameter("texture") || parseUrlParameter("tex");
            qualityText = parseUrlParameter("quality") || parseUrlParameter("q");
        }
        else {
            presentationUrl = this.presentation;
            itemUrl = this.item;
            templateUrl = this.template;
            modelUrl = this.model;
            geometryUrl = this.geometry;
            textureUrl = this.texture;
        }

        if (presentationUrl) {
            return application.loadPresentation(presentationUrl);
        }
        if (itemUrl) {
            return application.loadItem(itemUrl, templateUrl);
        }
        if (modelUrl) {
            return this.application.loadModel(modelUrl);
        }
        if (geometryUrl) {
            this.application.loadGeometry(geometryUrl, textureUrl);
        }
    }

    protected firstConnected()
    {
        const system = this.application.system;

        new ContentLayer(system).appendTo(this);
        new ChromeLayer(system).appendTo(this);
    }
}