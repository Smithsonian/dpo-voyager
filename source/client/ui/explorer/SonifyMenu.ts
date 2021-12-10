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

import CVToolProvider from "../../components/CVToolProvider";
import CVLanguageManager from "client/components/CVLanguageManager";
import { EViewPreset } from "client/../../libs/ff-three/source/UniversalCamera";
import {getFocusableElements, focusTrap} from "../../utils/focusHelpers";
import CVSonify, { ESonifyMode } from "../../components/CVSonify";
import CVOrbitNavigation from "../../components/CVOrbitNavigation";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-sonify-menu")
export default class SonifyMenu extends SystemView
{
    protected needsFocus: boolean = false;

    protected get toolProvider() {
        return this.system.getMainComponent(CVToolProvider);
    }
    protected get language() {
        return this.system.getComponent(CVLanguageManager);
    }
    protected get navigation() {
        return this.system.getComponent(CVOrbitNavigation);
    }
    protected get sonification() {
        return this.system.getComponent(CVSonify);
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-bottom-bar-container", "sv-transition", "sv-sonify-menu");
        setTimeout(() => this.classList.remove("sv-transition"), 1);
        this.needsFocus = true;
    }

    protected connected()
    {
        super.connected();
        //this.toolProvider.on<IActiveToolEvent>("active-component", this.onUpdate, this);
        this.language.outs.language.on("value", this.onUpdate, this);
        window.addEventListener("keydown", this.onKeyDown);
    }

    protected disconnected()
    {
        window.removeEventListener("keydown", this.onKeyDown);
        this.language.outs.language.off("value", this.onUpdate, this);
        //this.toolProvider.off<IActiveToolEvent>("active-component", this.onUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        const language = this.language;
        const navigation = this.navigation;
        const sonify = this.sonification;

        const preset = navigation.ins.preset;
        const mode = sonify.ins.mode;

        const presetMap = [ EViewPreset.Front, EViewPreset.Back,
            EViewPreset.Left, EViewPreset.Right,
            EViewPreset.Top, EViewPreset.Bottom ];

        return html`<div class="sv-blue-bar" role=region title="Sonification Options" @keydown=${e =>this.onKeyDown(e)}>
                <div class="sv-section">
                    <ff-button class="sv-section-lead" transparent icon="close" title=${language.getLocalizedString("Close")} @click=${this.onClose}></ff-button>
                    <div role="region" aria-label="Select view toolbar" class="sv-tool-controls">
                        <sv-property-options role="radiogroup" .property=${preset} .language=${language} name=${language.getLocalizedString("View Direction")} .indexMap=${presetMap}></sv-property-options>
                        <sv-property-options role="radiogroup" .property=${mode} .language=${language} name=${language.getLocalizedString("Mode")} ></sv-property-options>
                    </div>
                </div>
            </div>`;
    }

    protected updated(changedProperties) {
        super.updated(changedProperties);

        if(this.needsFocus) {
            this.setFocus();
            this.needsFocus = false;
        }
    }

    protected onKeyDown = (e: KeyboardEvent) =>
    {
        if (e.code === "Escape") {
            e.preventDefault();
            this.sonification.ins.active.setValue(false);
            this.sonification.ins.closed.set();
        }
        else if(e.code === "Tab") {
            const menuElements = getFocusableElements(this) as HTMLElement[];

            if(!document.activeElement.shadowRoot) {
                e.preventDefault();
                this.setFocus();
            }
            else {
                focusTrap(menuElements, e);
            }
        }
    }

    protected onClose(event: MouseEvent)
    {    
        event.stopPropagation();
        this.sonification.ins.active.setValue(false);
        this.sonification.ins.closed.set();
    }

    protected async setFocus()
    {
        await this.updateComplete;
        const focusElement = this.getElementsByTagName("sv-property-options").item(0) as HTMLElement;
        focusElement.focus();
    }
}
