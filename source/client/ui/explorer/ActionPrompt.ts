/**
 * 3D Foundation Project
 * Copyright 2023 Smithsonian Institution
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

@customElement("sv-action-prompt")
export default class ActionPrompt extends CustomElement
{    
    protected static readonly icon = html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M144 0C108.7 0 80 28.7 80 64V252.8c-5.2 3.6-10.2 7.6-14.9 11.9L44.8 283.2C26.5 299.9 16 323.5 16 348.3v10.2c0 54.1 28.7 104.1 75.4 131.3l2.6 1.5c23.2 13.6 49.7 20.7 76.6 20.7H296c66.3 0 120-53.7 120-120v-8V288c0-35.3-28.7-64-64-64c-2.8 0-5.6 .2-8.3 .5c-11-19.4-31.8-32.5-55.7-32.5c-5.3 0-10.5 .7-15.5 1.9c-10.8-20.2-32-33.9-56.5-33.9c-2.7 0-5.4 .2-8 .5V64c0-35.3-28.7-64-64-64zM128 64c0-8.8 7.2-16 16-16s16 7.2 16 16V200c0 10.3 6.6 19.5 16.4 22.8s20.6-.1 26.8-8.3c3-3.9 7.6-6.4 12.8-6.4c8.8 0 16 7.2 16 16v8c0 10.3 6.6 19.5 16.4 22.8s20.6-.1 26.8-8.3c3-3.9 7.6-6.4 12.8-6.4c8.8 0 16 7.2 16 16c0 9.1 5.1 17.4 13.3 21.5s17.9 3.2 25.1-2.3c2.7-2 6-3.2 9.6-3.2c8.8 0 16 7.2 16 16v96 8c0 39.8-32.2 72-72 72H170.6c-18.4 0-36.5-4.9-52.4-14.2l-11.7 20 11.7-20-2.6-1.5C83.6 429.7 64 395.5 64 358.5V348.3c0-11.3 4.8-22 13.1-29.6L96 301.5V344c0 8.8 7.2 16 16 16s16-7.2 16-16V266v-2V64z"/></svg>`;
    
    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-action-prompt");
    }

    protected render()
    {
        return html`<div class="sv-prompt"><div id="prompt" class="sv-action-prompt">${ActionPrompt.icon}</div></div>`;
    }
}