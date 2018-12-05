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

import LitElement, { customElement, property, PropertyValues } from "@ff/ui/LitElement";

import SystemController from "../core/components/SystemController";

import RenderView from "./ui/RenderView";
import OverlayView from "./ui/OverlayView";
import ExplorerApplication from "./ExplorerApplication";

import "./ui/styles.scss";

////////////////////////////////////////////////////////////////////////////////

@customElement("voyager-explorer")
export default class ExplorerView extends LitElement
{
    @property({ type: String })
    item = "";

    @property({ type: String })
    presentation = "";

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

    protected update(changedProperties: PropertyValues)
    {
        if (changedProperties.has("presentation") && this.presentation) {
            this.application.loadPresentation(this.presentation);
        }
        else if (changedProperties.has("item") && this.item) {
            this.application.loadItem(this.item);
        }
        else if (changedProperties.has("model") && this.model) {
            this.application.loadModel(this.model);
        }
        else if ((changedProperties.has("geometry") || changedProperties.has("texture")) && this.geometry) {
            this.application.loadGeometry(this.geometry, this.texture);
        }
    }

    protected firstConnected()
    {
        new RenderView(this.application.performer).setStyle({
            position: "absolute",
            top: "0", bottom: "0", left: "0", right: "0"
        }).appendTo(this);

        const controller = this.application.system.getComponent(SystemController);
        new OverlayView(controller).setStyle({
            position: "absolute",
            top: "0", bottom: "0", left: "0", right: "0"
        }).appendTo(this);
    }
}