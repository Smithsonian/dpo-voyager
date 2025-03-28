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

import CustomElement, { customElement, html, property } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-logo")
export default class Logo extends CustomElement
{  
    @property({ type: String })
    assetPath = "";
    
    protected static readonly defaultSmall = html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 83.1 83.1"><defs><style>.cls-1{fill:#bfbfbf;}</style></defs><title>voyager-75grey</title><path class="cls-1" d="M72.18,13.48,67.1,18.57c.5,3.19,1.23,12.48-4.76,23L42.66,21.89c10.21-5.84,19.21-5.31,22.68-4.8l5.25-5.25a41.5,41.5,0,1,0,1.59,1.64ZM7.48,52.91s-2.35-12.84,9-24.14c6.6-6.6,14.83-1.45,14.83-1.45A98.12,98.12,0,0,0,17.51,48.47C10.19,49.11,7.48,52.91,7.48,52.91Zm13.83,15.5V65.7l-6,3.07,2.81-6.24-3.53,1.18,2.53-6,9.31,9.31Zm34.17-.59c-11.3,11.3-24.14,9-24.14,9s3.8-2.71,4.43-10A97.8,97.8,0,0,0,56.93,53S62.08,61.22,55.48,67.82ZM54.7,51.5c-5.88,5.88-24.82,15.88-24.82,15.88l-13-13s9.9-18.86,15.86-24.82a48.27,48.27,0,0,1,8-6.47L61.16,43.48A47.53,47.53,0,0,1,54.7,51.5Z"/><path class="cls-1" d="M39.34,44.88a5.88,5.88,0,1,0,0-8.32A5.9,5.9,0,0,0,39.34,44.88Z"/></svg>`;
    protected static readonly defaultFull = html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380.54 83.1"><defs><style>.cls-1{fill:#bfbfbf;}</style></defs><title>voyager-75grey</title><path class="cls-1" d="M72.18,13.48,67.1,18.57c.5,3.19,1.23,12.48-4.76,23L42.66,21.89c10.21-5.84,19.21-5.31,22.68-4.8l5.25-5.25a41.5,41.5,0,1,0,1.59,1.64ZM7.48,52.91s-2.35-12.84,9-24.14c6.6-6.6,14.83-1.45,14.83-1.45A98.12,98.12,0,0,0,17.51,48.47C10.19,49.11,7.48,52.91,7.48,52.91Zm13.83,15.5V65.7l-6,3.07,2.81-6.24-3.53,1.18,2.53-6,9.31,9.31Zm34.17-.59c-11.3,11.3-24.14,9-24.14,9s3.8-2.71,4.43-10A97.8,97.8,0,0,0,56.93,53S62.08,61.22,55.48,67.82ZM54.7,51.5c-5.88,5.88-24.82,15.88-24.82,15.88l-13-13s9.9-18.86,15.86-24.82a48.27,48.27,0,0,1,8-6.47L61.16,43.48A47.53,47.53,0,0,1,54.7,51.5Z"/><path class="cls-1" d="M39.34,44.88a5.88,5.88,0,1,0,0-8.32A5.9,5.9,0,0,0,39.34,44.88Z"/><path class="cls-1" d="M131.52,23l-10.26,43.7h-13.4L97.6,23H92V16.42h21.64V23h-5.51l6.42,34.9,7.68-41.46h14.94V23Z"/><path class="cls-1" d="M154.82,67.38c-7.53,0-17.45-2.24-17.45-25.83s10.54-25.83,17.45-25.83,17.46,2.37,17.46,25.83C172.28,65.35,162.15,67.38,154.82,67.38Zm0-44.68c-4.88,0-7.68,3.91-7.68,18.85,0,15.15,3.57,18.85,7.68,18.85,4.26,0,7.68-3.49,7.68-18.85C162.5,26.89,159.57,22.7,154.82,22.7Z"/><path class="cls-1" d="M209.72,23,198.9,48.11v12h7.68v6.56H181.45V60.12h7.68v-12L178.31,23h-5.59V16.42h21V23h-4.81L194,37.92l7.4-21.5h14V23Z"/><path class="cls-1" d="M243.67,66.68,241,54.39H228.6l-1.26,5.73h5.51v6.56H211.63V60.12h5.59L228,16.42h13.68l10.75,43.7h5.65v6.56ZM234.81,24l-4.68,22.83h9.36Z"/><path class="cls-1" d="M278.63,67.38c-9.56,0-19.68-3.21-19.68-25.13s11.31-26.53,21-26.53a32,32,0,0,1,13.89,3.21V30.1h-6.56V24.66A28.73,28.73,0,0,0,280,23.61c-5,0-11.24,3.35-11.24,17.94,0,15.43,5.37,18,9.77,18a27.39,27.39,0,0,0,5.59-.63V44.13h-6.63V36.66h16.4v28.9A88.21,88.21,0,0,1,278.63,67.38Z"/><path class="cls-1" d="M298.93,66.68V60.12h6.28V23h-6.28V16.42h33.51V30.1h-6.56V24.73H315V36.66h14.66V44.2H315V58.37h10.89V52.3h6.56V66.68Z"/><path class="cls-1" d="M366.78,66.68l-8.3-21.78h-5.1V60.12H359v6.56H337.33V60.12h6.28V23h-6.28V16.42h20.38c10.47,0,17.31,2.65,17.31,13.47,0,5.66-1.6,10.19-7.61,12.85L375,60.12h5.59v6.56Zm-9.56-42.51h-3.84V38.06c8.31,0,11.87-1.89,11.87-7.47C365.25,26.47,363.43,24.17,357.22,24.17Z"/></svg>`;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-logo");
    }

    protected render()
    {
        const logoSm = html`<div class="sv-logo-sm"><object tabIndex="-1" data="${this.assetPath}images/logo-sm.svg" type="image/svg+xml" alt="Logo"></div>
            ${Logo.defaultSmall}
        </object></div>`;
        const logoFull = html`<div class="sv-logo-full"><object tabIndex="-1" style="height: 100%; width:100%" data="${this.assetPath}images/logo-full.svg" type="image/svg+xml" alt="Logo">
            ${Logo.defaultFull}
        </object></div>`;

        return html`<div class="sv-short">${logoSm}</div><div class="sv-full">${logoFull}</div>`;
    }
}