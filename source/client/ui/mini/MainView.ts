/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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

import CustomElement, { customElement } from "@ff/ui/CustomElement";

import ContentView from "./ContentView";

import MiniApplication, { IMiniApplicationProps } from "../../applications/MiniApplication";
import CVDocumentProvider from "client/components/CVDocumentProvider";

import "./styles.scss";

////////////////////////////////////////////////////////////////////////////////


/**
 * Main UI view for the Voyager Mini application.
 */
@customElement("voyager-mini")
export default class MainView extends CustomElement
{
    application: MiniApplication;

    get document() {
        const system = this.application.system;
        return system.getMainComponent(CVDocumentProvider).activeComponent;
    }

    constructor(application?: MiniApplication)
    {
        super();

        if (application) {
            this.application = application;
        }
    }

    protected firstConnected()
    {
        super.firstConnected();

        if (!this.application) {
            const props: IMiniApplicationProps = {
                root: this.getAttribute("root"),
                document: this.getAttribute("document"),
                model: this.getAttribute("model"),
                geometry: this.getAttribute("geometry"),
                texture: this.getAttribute("texture"),
                quality: this.getAttribute("quality"),
            };

            this.application = new MiniApplication(null, props);
        }

        const system = this.application.system;
        new ContentView(system).appendTo(this);
    }
}