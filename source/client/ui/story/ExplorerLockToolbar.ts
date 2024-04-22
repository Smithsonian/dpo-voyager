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

import SystemView from "client/../../libs/ff-scene/source/ui/SystemView";
import { customElement, html } from "../explorer/DocumentView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-explorer-lockbar")
export default class ExplorerLockToolbar extends SystemView
{
    _explorerElement: HTMLElement = null;

    constructor(explorerElement: HTMLElement)
    {
        super();
        
        this._explorerElement = explorerElement;
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-panel", "sv-explorer-lockbar");
    }

    protected disconnected()
    {
        super.disconnected();
    }

    protected render()
    {
        return html`<div class="sv-panel-header sv-panel-locks">
            <ff-button-group>
                <ff-button text="Full" @click=${this.unlockAspectRatio}></ff-button>
                <ff-button text="16:9" @click=${e => this.setAspectRatio(9,16)}></ff-button>
                <ff-button text="20:9" @click=${e => this.setAspectRatio(9,20)}></ff-button>
                <ff-button text="4:3" @click=${e => this.setAspectRatio(3,4)}></ff-button>
            </ff-button-group>
        </div>
        `;
    }

    protected unlockAspectRatio() 
    {
        const element = this._explorerElement;
        element.style.aspectRatio = "auto";
        element.style.width = "100%";
    }

    protected setAspectRatio(x: number, y: number)
    {
        const element = this._explorerElement;
        element.style.removeProperty("width");
        element.style.aspectRatio = (x/y).toString();
    }
}