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

import CustomElement, { customElement, property, html } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-spinner")
export default class Spinner extends CustomElement
{
    @property({ type: Boolean })
    visible = false;

    @property({ type: String })
    assetPath = "";

    protected static readonly template = html`<div class="sv-spinner-wheel"><svg viewBox="0 0 101.64261 101.4383" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg"><g transform="translate(-67.120928,-102.35083)"><circle style="fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#bfbfbf;stroke-width:3;stroke-miterlimit:4;stroke-dasharray:12, 12;stroke-dashoffset:0;stroke-opacity:1" id="path77" cx="117.94224" cy="152.9675" r="49.321297" /></g></svg></div>`;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-spinner");
    }

    protected render()
    {
        const spinner = html`<div class="sv-spinner-wheel"><object data="${this.assetPath}images/spinner.svg" type="image/svg+xml" alt="Spinner">
            ${Spinner.template}
        </object></div>`;

        this.style.visibility = this.visible ? "visible" : "hidden";
        return spinner;
    }
}