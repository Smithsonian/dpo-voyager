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

import CustomElement, { customElement } from "@ff/ui/CustomElement";

import ExplorerApplication, { IExplorerApplicationProps } from "../Application";

import ContentView from "./ContentView";
import ChromeView from "./ChromeView";

import "./styles.scss";

////////////////////////////////////////////////////////////////////////////////

/**
 * Main UI View for the Voyager Explorer application.
 */
@customElement("voyager-explorer")
export default class MainView extends CustomElement
{
    readonly application: ExplorerApplication;

    constructor(application?: ExplorerApplication)
    {
        super();

        if (application) {
            this.application = application;
        }
        else {
            const props: IExplorerApplicationProps = {
                item: this.getAttribute("item"),
                presentation: this.getAttribute("presentation"),
                template: this.getAttribute("template"),
                model: this.getAttribute("model"),
                geometry: this.getAttribute("geometry"),
                texture: this.getAttribute("texture")
            };

            this.application = new ExplorerApplication(null, props);
        }
    }

    protected firstConnected()
    {
        const system = this.application.system;

        new ContentView(system).appendTo(this);
        new ChromeView(system).appendTo(this);
    }
}