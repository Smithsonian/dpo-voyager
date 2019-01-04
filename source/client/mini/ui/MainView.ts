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

import MiniApplication, { IMiniApplicationProps } from "../MiniApplication";

import ContentView from "../../explorer/ui/ContentView";

import "./styles.scss";

////////////////////////////////////////////////////////////////////////////////

/**
 * Main UI view for the Voyager Mini application.
 */
@customElement("voyager-mini")
export default class MainView extends CustomElement
{
    readonly application: MiniApplication;

    constructor(application?: MiniApplication)
    {
        super();

        if (application) {
            this.application = application;
        }
        else {
            const props: IMiniApplicationProps = {
                item: this.getAttribute("item"),
                model: this.getAttribute("model"),
                geometry: this.getAttribute("geometry"),
                texture: this.getAttribute("texture")
            };

            this.application = new MiniApplication(null, props);
        }
    }

    protected firstConnected()
    {
        const system = this.application.system;
        new ContentView(system).appendTo(this);
    }
}