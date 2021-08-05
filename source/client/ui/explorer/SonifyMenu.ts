/**
 * 3D Foundation Project
 * Copyright 2021 Smithsonian Institution
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

import SystemView, { customElement, html } from "@ff/scene/ui/SystemView";

import CVToolProvider, { IActiveToolEvent } from "../../components/CVToolProvider";
import CVLanguageManager from "client/components/CVLanguageManager";
import { EViewPreset } from "client/../../libs/ff-three/source/UniversalCamera";
import CVOrbitNavigation from "client/components/CVOrbitNavigation";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-sonify-menu")
export default class SonifyMenu extends SystemView
{
    protected get toolProvider() {
        return this.system.getMainComponent(CVToolProvider);
    }
    protected get language() {
        return this.system.getComponent(CVLanguageManager);
    }
    protected get navigation() {
        return this.system.getComponent(CVOrbitNavigation);
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-bottom-bar-container", "sv-transition", "sv-sonify-menu");
        setTimeout(() => this.classList.remove("sv-transition"), 1);
    }

    protected connected()
    {
        super.connected();
        //this.toolProvider.on<IActiveToolEvent>("active-component", this.onUpdate, this);
        this.language.outs.language.on("value", this.onUpdate, this);
    }

    protected disconnected()
    {
        this.language.outs.language.off("value", this.onUpdate, this);
        //this.toolProvider.off<IActiveToolEvent>("active-component", this.onUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        const language = this.language;
        const navigation = this.navigation;

        const preset = navigation.ins.preset;

        const presetMap = [ EViewPreset.Front, EViewPreset.Back,
            EViewPreset.Left, EViewPreset.Right,
            EViewPreset.Top, EViewPreset.Bottom ];

        return html`<div class="sv-blue-bar">
                <div class="sv-section">
                    <div role="region" aria-label="Select view toolbar" class="sv-tool-controls">
                        <sv-property-options role="radiogroup" .property=${preset} .language=${language} name=${language.getLocalizedString("View")} .indexMap=${presetMap}></sv-property-options>
                    </div>
                </div>
            </div>`;
    }

    /*protected onClose(event: MouseEvent)
    {
        this.dispatchEvent(new CustomEvent("close"));
        event.stopPropagation();
    }*/
}
