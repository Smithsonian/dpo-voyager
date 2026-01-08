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

import System from "@ff/graph/System";

import "@ff/ui/Button";
import  "@ff/ui/Dropdown";
import Button, { IButtonClickEvent } from "@ff/ui/Button";
import SystemView, { customElement, html } from "@ff/scene/ui/SystemView";

import CVStoryApplication from "../../components/CVStoryApplication";
import CVTaskProvider, { ETaskMode, IActiveTaskEvent, ITaskSetEvent } from "../../components/CVTaskProvider";
import CVAssetReader from "../../components/CVAssetReader";
import CVLanguageManager from "client/components/CVLanguageManager";
import { IMenuItem } from "@ff/ui/Menu";
import CVSetup from "client/components/CVSetup";


////////////////////////////////////////////////////////////////////////////////

@customElement("sv-task-bar")
export default class TaskBar extends SystemView
{
    protected story: CVStoryApplication = null;
    protected taskProvider: CVTaskProvider = null;

    constructor(system?: System)
    {
        super(system);

        this.story = system.getMainComponent(CVStoryApplication);
        this.taskProvider = system.getMainComponent(CVTaskProvider);
    }

    protected get assetReader() {
        return this.system.getMainComponent(CVAssetReader);
    }

    protected get language() {
        return this.system.getComponent(CVLanguageManager);
    }

    protected firstConnected()
    {
        this.classList.add("sv-task-bar");
    }

    protected connected()
    {
        this.taskProvider.on<ITaskSetEvent>("scoped-components", this.onUpdate, this);
        this.taskProvider.on<IActiveTaskEvent>("active-component", this.onUpdate, this);
        this.language.outs.uiLanguage.on("value", this.onUpdate, this);
    }

    protected disconnected()
    {
        this.taskProvider.off<ITaskSetEvent>("scoped-components", this.onUpdate, this);
        this.taskProvider.off<IActiveTaskEvent>("active-component", this.onUpdate, this);
        this.language.outs.uiLanguage.on("value", this.onUpdate, this);
    }

    protected render()
    {
        const tasks = this.taskProvider.scopedComponents;
        const activeTask = this.taskProvider.activeComponent;
        const taskMode = this.taskProvider.ins.mode.value;
        const taskModeText = this.taskProvider.ins.mode.getOptionText();
        const exitButtonVisible = taskMode !== ETaskMode.Standalone;
        const languageManager = this.language;
        const saveName = languageManager.getUILocalizedString(taskMode !== ETaskMode.Standalone ? "Save" : "Download");

        const saveOptions :IMenuItem[] = [
            {name: "save", icon: "save", text: saveName}
        ];
        if(taskMode !== ETaskMode.Standalone){
            saveOptions.push(
                {name: "capture", icon: "save", text: languageManager.getLocalizedString("Save State")},
                {name: "download", icon:"download", text:languageManager.getLocalizedString("Download")},
            );
        }
        saveOptions.push({name: "iiif", icon:"download", text:languageManager.getLocalizedString("IIIF")});

        return html`
            <img class="sv-story-logo" src=${this.assetReader.getSystemAssetUrl("images/voyager-75grey.svg")} alt="Logo"/>
            <div class="sv-mode ff-text">${taskModeText}</div>
            <div class="sv-spacer"></div>
            <div class="sv-divider"></div>
            <div class="ff-flex-row ff-group ff-scroll-x" @click=${this.onClickTask}>
                ${tasks.map((task, index) => html`<ff-button text=${languageManager.getUILocalizedString(task.text)} icon=${task.icon} index=${index} ?selected=${task === activeTask}></ff-button>`)}
            </div>
            <div class="sv-divider"></div>
            <div class="sv-spacer"></div>
            <div class="sv-divider"></div>
            <div class="ff-flex-row ff-group" style="min-width:100px">
                ${1 < saveOptions.length? 
                    html`<ff-dropdown caret text="${saveName}" icon="save" @select=${this.onSelectSave} .items=${saveOptions}></ff-dropdown>`
                  : html`<ff-button text="${saveOptions[0].text}" icon="${saveOptions[0].icon}" @click=${()=>this.onSelectSave(new CustomEvent("select", {detail: {item: saveOptions[0]}}))}></ff-button>`
                }
                ${exitButtonVisible ? html`<ff-button text="${languageManager.getLocalizedString("Exit")}" icon="exit" @click=${this.onClickExit}></ff-button>` : null}
            </div>
        `;
    }

    protected onClickTask(event: IButtonClickEvent)
    {
        if (event.target instanceof Button) {
            const tasks = this.taskProvider.scopedComponents;
            this.taskProvider.activeComponent = tasks[event.target.index];
        }
    }

    protected onSelectSave(event :{detail: {item: IMenuItem}}){
        switch(event.detail.item.name){
            case "save":
                this.story.ins.save.set();
                break;
            case "capture":
                this.system.getComponent(CVSetup).ins.saveState.set();
                this.story.ins.save.set();
                break;
            case "download":
                this.story.ins.download.set();
                break;
            case "iiif":
                this.story.ins.iiif.set();
                break;
            default:
                console.warn("Unhandled save method : ", event.detail.item.name);
        }
    }

    protected onClickExit()
    {
        this.story.ins.exit.set();
    }
}