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
import {getFocusableElements, focusTrap} from "../../utils/focusHelpers";
import CVSonify, { ESonifyMode } from "../../components/CVSonify";
import CVOrbitNavigation, { EViewPreset } from "../../components/CVOrbitNavigation";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-sonify-menu")
export default class SonifyMenu extends SystemView
{
    protected needsFocus: boolean = false;
    protected sonifyDot: HTMLDivElement = null;

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

        if(this.navigation.ins.preset.value === EViewPreset.None) {
            this.navigation.ins.preset.setValue(EViewPreset.Front);
        }
    }

    protected connected()
    {
        super.connected();
        //this.toolProvider.on<IActiveToolEvent>("active-component", this.onUpdate, this);
        this.language.outs.language.on("value", this.onUpdate, this);
        this.sonification.outs.mode.on("value", this.onModeChange, this);
        this.sonification.outs.scanline.on("value", this.onScanUpdate, this);
        this.sonification.ins.scanning.on("value", this.onScanEnable, this);
        window.addEventListener("keydown", this.onKeyDown);
        this.sonification.ins.visible.setValue(true);

        const root = this.getRootNode();
        if(root instanceof ShadowRoot) {
            const mainView = (root as ShadowRoot).querySelectorAll("sv-content-view")[0];
            const dot = this.sonifyDot = document.createElement("div");
            dot.classList.add("sv-sonify-circle");
            mainView.appendChild(dot);
        }
    }

    protected disconnected()
    {
        this.sonification.ins.visible.setValue(false);
        window.removeEventListener("keydown", this.onKeyDown);
        this.sonification.ins.scanning.off("value", this.onScanEnable, this);
        this.sonification.outs.scanline.off("value", this.onScanUpdate, this);
        this.sonification.outs.mode.off("value", this.onModeChange, this);
        this.language.outs.language.off("value", this.onUpdate, this);
        //this.toolProvider.off<IActiveToolEvent>("active-component", this.onUpdate, this);

        this.sonifyDot.remove();

        super.disconnected();
    }

    protected render()
    {
        const language = this.language;
        const navigation = this.navigation;
        const sonify = this.sonification;

        const preset = navigation.ins.preset;
        const mode = sonify.ins.mode;
        const active = sonify.ins.active;
        const scan = sonify.ins.scanning;

        const presetMap = [ EViewPreset.Front, EViewPreset.Back,
            EViewPreset.Left, EViewPreset.Right,
            EViewPreset.Top, EViewPreset.Bottom ];

        return html`<div class="sv-blue-bar" role=region title="Sonification Options" @keydown=${e =>this.onKeyDown(e)}>
                <div class="sv-section">
                    <ff-button class="sv-section-lead" transparent icon="close" title=${language.getLocalizedString("Close")} @click=${this.onClose}></ff-button>
                    <div role="region" aria-label="Sonify toolbar" class="sv-tool-controls">
                        <sv-property-options role="radiogroup" .property=${preset} .language=${language} name=${language.getLocalizedString("View Direction")} .indexMap=${presetMap}></sv-property-options>
                        <sv-property-options role="radiogroup" .property=${mode} .language=${language} name=${language.getLocalizedString("Mode")} ></sv-property-options>
                        <sv-property-boolean .property=${active} .language=${language} name=${language.getLocalizedString("Start Sonify")}></sv-property-boolean>
                        <sv-property-boolean .property=${scan} .language=${language} name=${language.getLocalizedString("Start Scan")}></sv-property-boolean>
                    </div>
                </div>
                <div class="sr-only" id="sonify-intro" aria-live="polite"></div>
            </div>`;
    }

    protected updated(changedProperties) {
        super.updated(changedProperties);

        if(this.needsFocus) {
            this.setFocus();
            this.needsFocus = false;

            setTimeout(() => {
            const introElement = this.getElementsByClassName("sr-only").item(0) as HTMLElement;
            introElement.innerText = "This feature uses sound to describe the shape of a 3D object. "
            + "As you move your pointer over the object the sound will change based on how "
            + "close or far the surface is from you at that point. There are 2 options for type of "
            + "sound change... frequency and rate of beep. Select a type and then click the start button "
            + "to try it out!";
            }, 100);
        }
    }

    protected onKeyDown = (e: KeyboardEvent) =>
    {
        if (e.code === "Escape") {
            e.preventDefault();
            this.sonification.ins.active.setValue(false);
            this.sonification.ins.scanning.setValue(false);
            this.sonification.ins.visible.setValue(false);
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
        this.sonification.ins.scanning.setValue(false);
        this.sonification.ins.visible.setValue(false);
        this.sonification.ins.closed.set();
    }

    protected onModeChange()
    {
        const sonifyOuts = this.sonification.outs;

        const introElement = this.getElementsByClassName("sr-only").item(0) as HTMLElement;

        if(sonifyOuts.mode.value === ESonifyMode.Frequency) {
            introElement.innerText = "Higher frequency means closer surface";
        }
        else {
            introElement.innerText = "Faster beeps mean a closer surface"
        }
    }

    protected onScanUpdate()
    {
        const scanline = this.sonification.outs.scanline.value;
        const dot = this.sonifyDot;
        dot.style.top = scanline[1].toString() + "px";
        dot.style.left = (scanline[0]-(dot.clientHeight/2)).toString() + "px";
    }

    protected onScanEnable()
    {
        const scanning = this.sonification.ins.scanning.value;
        const dot = this.sonifyDot;
        
        dot.style.top = "-10000px";
        dot.style.display = scanning ? "block" : "none";
    }

    protected async setFocus()
    {
        await this.updateComplete;
        const focusElement = this.getElementsByTagName("sv-property-options").item(0) as HTMLElement;
        focusElement.focus();
    }
}
