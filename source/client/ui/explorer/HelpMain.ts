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

import Popup, { customElement, html } from "@ff/ui/Popup";

import "@ff/ui/Button";
import "@ff/ui/TextEdit";
import CVLanguageManager from "client/components/CVLanguageManager";
import { ILanguageOption } from "client/schema/setup";
import {getFocusableElements, focusTrap} from "../../utils/focusHelpers";
import { IButtonClickEvent } from "@ff/ui/Button";

////////////////////////////////////////////////////////////////////////////////

enum EHelpSection { Nav, Menu }

@customElement("sv-main-help")
export default class HelpMain extends Popup
{
    protected url: string;
    protected language: CVLanguageManager = null;
    protected helpView: EHelpSection = EHelpSection.Nav;

    static show(parent: HTMLElement, language: CVLanguageManager): Promise<void>
    {
        const menu = new HelpMain(language);
        parent.appendChild(menu);

        return new Promise((resolve, reject) => {
            menu.on("close", () => resolve());
        });
    }

    constructor( language: CVLanguageManager )
    {
        super();

        this.language = language;
        this.position = "center";
        this.modal = true;

        this.url = window.location.href;
    }

    close()
    {
        this.dispatchEvent(new CustomEvent("close"));
        this.remove();
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-main-help");
    }

    protected render()
    {
        const language = this.language;
        const section = this.helpView;

        const navContent = html`<div class="sv-help-row">
                                    <div class="sv-help-section">
                                        <ff-icon class="ff-off" name="rotate"></ff-icon>
                                        <div class="sv-help-text">Left-click and drag<br>or one-finger drag to orbit</div>
                                    </div>
                                    <div class="sv-help-section">
                                        <ff-icon class="ff-off" name="move"></ff-icon>
                                        <div class="sv-help-text">Right-click and drag<br>or two-finger drag to pan</div>
                                    </div>
                                    <div class="sv-help-section">
                                        <ff-icon class="ff-off" name="zoom"></ff-icon>
                                        <div class="sv-help-text">Use a mouse wheel<br>or pinch to zoom</div>
                                    </div>
                                </div>`;

        const menuContent = html`<div class="sv-help-text">The tools below can be accessed by clicking the corresponding icons on the menu bar to the left of the screen.</div>
                                <div class="sv-help-row">
                                    <div class="sv-help-section">
                                        <ff-icon class="ff-off" name="ar"></ff-icon>
                                        <div class="sv-help-text">Launch an augmented<br>reality experience</div>
                                    </div>
                                    <div class="sv-help-section">
                                        <ff-icon class="ff-off" name="audio"></ff-icon>
                                        <div class="sv-help-text">Hear an audio<br>narration of the scene</div>
                                    </div>
                                    <div class="sv-help-section">
                                        <ff-icon class="ff-off" name="globe"></ff-icon>
                                        <div class="sv-help-text">Take a curated guided<br>tour of the scene</div>
                                    </div>
                                </div>
                                <div class="sv-help-row">
                                    <div class="sv-help-section">
                                        <ff-icon class="ff-off" name="article"></ff-icon>
                                        <div class="sv-help-text">Read articles about<br>the scene content</div>
                                    </div>
                                    <div class="sv-help-section">
                                        <ff-icon class="ff-off" name="comment"></ff-icon>
                                        <div class="sv-help-text">Show annotations<br>highlighting key points</div>
                                    </div>
                                    <div class="sv-help-section">
                                        <ff-icon class="ff-off" name="share"></ff-icon>
                                        <div class="sv-help-text">Share the experience<br>with a friend!</div>
                                    </div>
                                </div>
                                <div class="sv-help-row">
                                    <div class="sv-help-section">
                                        <ff-icon class="ff-off" name="expand"></ff-icon>
                                        <div class="sv-help-text">View the experience<br>in fullscreen mode</div>
                                    </div>
                                    <div class="sv-help-section">
                                        <ff-icon class="ff-off" name="tools"></ff-icon>
                                        <div class="sv-help-text">Open the advanced<br>tool menu</div>
                                    </div>
                                </div>`;

        return html`
        <div class="sv-help-region" role="region" aria-label="Introduction to Voyager" @keydown=${e =>this.onKeyDownMain(e)}>
            <div class="ff-flex-row">
                <div class="ff-flex-spacer ff-title">${language.getLocalizedString("Introduction to Voyager")}</div>
                <ff-button icon="close" transparent class="ff-close-button" title=${language.getLocalizedString("Close")} @click=${this.close}></ff-button>
            </div>
            <div class="sv-commands">
                <ff-button text="Navigation" index=${EHelpSection.Nav} selectedIndex=${section} @click=${this.onClickSection}></ff-button>
                <ff-button text="Menu Icons" index=${EHelpSection.Menu} selectedIndex=${section} @click=${this.onClickSection}></ff-button>
            </div>
            ${section === EHelpSection.Nav ? navContent : menuContent}
        </div>
        `;
    }

    protected firstUpdated(changedProperties) {
        super.firstUpdated(changedProperties);

        //(Array.from(this.getElementsByClassName("sv-entry")).find(elem => elem.getAttribute("tabIndex") === "0") as HTMLElement).focus();
    }

    protected onClickSection(event: IButtonClickEvent)
    {
        this.helpView = event.target.index;
        this.requestUpdate();
    }

    protected onKeyDownEntry(e: KeyboardEvent, index: number)
    {
        const language = this.language;
        if (e.code === "Space" || e.code === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            language.ins.language.setValue(language.activeLanguages[index].id);
            this.close();
        }
        else if(e.code === "ArrowUp" || e.code === "ArrowDown") {
            const currentActive = e.target instanceof Element ? e.target as Element : null;
            if(currentActive) {
                const newActive = e.code === "ArrowUp" ? currentActive.previousElementSibling : currentActive.nextElementSibling;
                if(newActive) {
                    currentActive.setAttribute("tabIndex", "-1");
                    newActive.setAttribute("tabIndex", "0");
                    (newActive as HTMLElement).focus();
                }
            }
        }
        else if(e.code === "Tab") {
            this.addEventListener('blur', this.tabReset, { once: true, capture: true });
        }
    }

    protected onKeyDownMain(e: KeyboardEvent)
    {
        if (e.code === "Escape") {
            this.close();
        }
        else if(e.code === "Tab") {
            focusTrap(getFocusableElements(this) as HTMLElement[], e);
        }
    }

    // resets tabIndex if needed
    protected tabReset(e: FocusEvent) {
        const currentActive = e.target instanceof Element ? e.target as Element : null;
        if(currentActive) {
            const currentSelected = Array.from(currentActive.parentElement.children).find(elem => elem.hasAttribute("selected"));
            if(currentSelected !== currentActive) {
                currentActive.setAttribute("tabIndex", "-1");
                currentSelected.setAttribute("tabIndex", "0");
            }
        }
    }
}
