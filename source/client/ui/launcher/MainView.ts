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

import CustomElement, { customElement } from "@ff/ui/CustomElement";

import MiniApplication, { IMiniApplicationProps } from "../../applications/MiniApplication";

import ContentView from "../mini/ContentView";

import "./styles.scss";

////////////////////////////////////////////////////////////////////////////////

/**
 * Voyager Launcher custom DOM element. Displays a 2D or 3D thumbnail.
 * When clicked displays experience in Voyager Explorer (in-place or fullscreen).
 */
@customElement("voyager-launcher")
export default class MainView extends CustomElement
{
    application: MiniApplication;

    protected firstConnected()
    {
        super.firstConnected();

        this.classList.add("voyager-launcher");

        const props: IMiniApplicationProps = {
            root: this.getAttribute("root"),
            document: this.getAttribute("document"),
            model: this.getAttribute("model"),
            geometry: this.getAttribute("geometry"),
            texture: this.getAttribute("texture"),
            quality: this.getAttribute("quality") || "Thumb",
        };

        this.application = new MiniApplication(null, props);

        const system = this.application.system;
        new ContentView(system).appendTo(this);
    }
}