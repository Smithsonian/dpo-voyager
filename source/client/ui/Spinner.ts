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

import CustomElement, { customElement, property, html } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-spinner")
export default class Spinner extends CustomElement
{
    @property({ type: Boolean })
    visible = false;

    protected static readonly template = html`<div class="sv-spinner-wheel"><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve"><style type="text/css">.st0{fill:none;stroke:#009ADE;stroke-width:5;stroke-miterlimit:10;}.st1{fill:none;stroke:#FFCD00;stroke-width:5;stroke-miterlimit:10;}</style><circle class="st0" cx="256.6" cy="256" r="252"/><path class="st1" d="M408.6,307c-16.3-28-42.1-28.4-45.3-28.3c0,0,0-0.1,0-0.1L472,256l-108.7-22.6l0,0c1.1-1,22.3-19.7,54-20.2 c23.9-0.4,44.6-29.6,31.4-52.1c0,0-3.9,35.4-48.6,23.6c-31.4-8.3-49.9,9.7-52,12l0,0l60.9-93L316,164.5c0,0,0,0,0,0 c0.1-1.4,1.8-29.6,23.9-52.4c16.7-17.2,10.6-52.5-14.6-59.1c0,0,22.2,27.8-17.7,51c-28.1,16.3-28.4,42.1-28.3,45.3l-0.1,0 L256.6,40.5l-22.7,108.7c0,0,0,0,0,0c-0.9-1-19.7-22.2-20.2-54c-0.4-23.9-29.6-44.6-52.1-31.4c0,0,35.3,3.9,23.6,48.6 c-8.3,31.5,9.8,49.9,12,52.1l0,0l-93-60.9l0,0l0,0l49.6,75.7l11.3,17.2c0,0,0,0,0,0c-0.9,0-29.4-1.6-52.5-23.9 c-17.2-16.7-52.5-10.6-59.1,14.6c0,0,27.8-22.2,51,17.7c16.4,28.1,42.3,28.4,45.3,28.3c0,0,0,0,0,0L41.1,256l108.8,22.7v0 c-0.7,0.7-22,19.7-54,20.2c-23.9,0.4-44.6,29.6-31.4,52.1c0,0,3.9-35.4,48.6-23.6c31.5,8.3,50-9.9,52.1-12c0,0,0,0.1,0.1,0.1 l-60.9,92.9l92.9-60.9c0,1-1.6,29.5-23.9,52.5c-16.7,17.2-10.6,52.5,14.6,59.1c0,0-22.2-27.8,17.7-51c28.1-16.4,28.4-42.2,28.3-45.3 c0,0,0.1,0,0.1,0l22.7,108.7l22.7-108.7l0,0c0.8,0.9,19.7,22.1,20.2,54c0.4,23.9,29.6,44.6,52.1,31.4c0,0-35.3-3.9-23.6-48.5 c8.3-31.5-9.8-49.9-12-52.1c0,0,0.1,0,0.1-0.1l92.9,60.9l-32.1-49.1L348,315.4l0,0c1.3,0.1,29.6,1.7,52.4,23.9 c17.2,16.7,52.5,10.6,59.1-14.6C459.6,324.7,431.8,346.9,408.6,307z"/></svg></div>`;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-spinner");
    }

    protected render()
    {
        this.style.visibility = this.visible ? "visible" : "hidden";
        return Spinner.template;
    }
}