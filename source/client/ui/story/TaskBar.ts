/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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
import Button, { IButtonClickEvent } from "@ff/ui/Button";

import SystemView, { customElement, html } from "@ff/scene/ui/SystemView";

import CVStoryApplication from "../../components/CVStoryApplication";
import CVTaskProvider, { ETaskMode, IActiveTaskEvent, ITaskSetEvent } from "../../components/CVTaskProvider";
import CVAssetReader from "../../components/CVAssetReader";


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

    protected firstConnected()
    {
        this.classList.add("sv-task-bar");
    }

    protected connected()
    {
        this.taskProvider.on<ITaskSetEvent>("scoped-components", this.onUpdate, this);
        this.taskProvider.on<IActiveTaskEvent>("active-component", this.onUpdate, this);
    }

    protected disconnected()
    {
        this.taskProvider.off<ITaskSetEvent>("scoped-components", this.onUpdate, this);
        this.taskProvider.off<IActiveTaskEvent>("active-component", this.onUpdate, this);
    }

    protected render()
    {
        const tasks = []; //this.taskProvider.scopedComponents;
        const activeTask = this.taskProvider.activeComponent;
        const taskMode = this.taskProvider.ins.mode.value;
        const taskModeText = "Paint";//this.taskProvider.ins.mode.getOptionText();
        const downloadButtonVisible = taskMode !== ETaskMode.Standalone;
        const exitButtonVisible = taskMode !== ETaskMode.Standalone;
        const saveName = "Save Screenshot";//taskMode !== ETaskMode.Standalone ? "Save" : "Download";

        return html`
            <img class="sv-story-logo" src=${this.assetReader.getSystemAssetUrl("images/voyager-75grey.svg")} alt="Logo"/>
            <div class="sv-mode ff-text">${taskModeText}</div>
            <div class="sv-spacer"></div>
            <div class="sv-spacer"></div>
            <div class="sv-divider"></div>
            <div class="ff-flex-row ff-group">
                <ff-button text=${saveName} icon="save" @click=${this.onClickSave}></ff-button>
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

    protected onClickSave()
    {
        this.story.ins.save.set();
    }

    protected onClickDownload()
    {
        this.story.ins.download.set();
    }

    protected onClickExit()
    {
        this.story.ins.exit.set();
    }
}