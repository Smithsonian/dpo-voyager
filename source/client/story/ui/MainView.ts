/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
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

import parseUrlParameter from "@ff/browser/parseUrlParameter";
import localStorage from "@ff/browser/localStorage";

import StoryApplication, { IStoryApplicationProps } from "../StoryApplication";
import CStory from "../components/CStory";

import CustomElement, { customElement } from "@ff/ui/CustomElement";
import DockView, { DockContentRegistry, IDockElementLayout } from "@ff/ui/DockView";
import TaskBar from "./TaskBar";

import ExplorerPanel from "./ExplorerPanel";
import TaskPanel from "./TaskPanel";
import LogPanel from "./LogPanel";
import ConsolePanel from "./ConsolePanel";
import HierarchyPanel from "./HierarchyPanel";
import InspectorPanel from "./InspectorPanel";

import "./styles.scss";

////////////////////////////////////////////////////////////////////////////////

interface IUIState
{
    regularLayout: IDockElementLayout;
    expertLayout: IDockElementLayout;
    expertMode: boolean;
}

@customElement("voyager-story")
export default class MainView extends CustomElement
{
    protected application: StoryApplication;
    protected dockView: DockView;

    protected registry: DockContentRegistry;
    protected state: IUIState;

    constructor(application?: StoryApplication)
    {
        super();
        this.onUnload = this.onUnload.bind(this);

        if (application) {
            this.application = application;
        }
        else {
            const props: IStoryApplicationProps = {
                item: this.getAttribute("item"),
                presentation: this.getAttribute("presentation"),
                template: this.getAttribute("template"),
                model: this.getAttribute("model"),
                geometry: this.getAttribute("geometry"),
                texture: this.getAttribute("texture"),
                quality: this.getAttribute("quality"),

                referrer: this.getAttribute("referrer"),
                mode: this.getAttribute("mode"),
                expert: this.hasAttribute("expert")
            };

            this.application = new StoryApplication(null, props);
        }

        this.dockView = null;

        const system = this.application.system;

        const story = system.components.get(CStory);
        story.ins.expertMode.on("value", this.onExpertMode, this);

        const registry = this.registry = new Map();
        const explorer = this.application.explorer;
        registry.set("explorer", () => new ExplorerPanel(explorer));
        registry.set("task", () => new TaskPanel(system));
        registry.set("log", () => new LogPanel(system));
        registry.set("console", () => new ConsolePanel(system));
        registry.set("hierarchy", () => new HierarchyPanel(system));
        registry.set("inspector", () => new InspectorPanel(system));

        const reset = parseUrlParameter("reset") !== undefined;
        const state = reset ? null : localStorage.get("voyager-story", "main-view-state");

        this.state = state || {
            regularLayout: MainView.regularLayout,
            expertLayout: MainView.expertLayout,
            expertMode: story.ins.expertMode.value
        };

        story.ins.expertMode.setValue(this.state.expertMode);
    }

    protected firstConnected()
    {
        this.setStyle({
            display: "flex",
            flexDirection: "column"
        });

        this.appendElement(new TaskBar(this.application.system));

        this.dockView = this.appendElement(DockView);
        this.restoreLayout();

        window.addEventListener("beforeunload", this.onUnload);
    }

    protected disconnected()
    {
        this.storeLayout();
        localStorage.set("voyager-story", "main-view-state", this.state);
    }

    protected onUnload()
    {
        this.storeLayout();
        localStorage.set("voyager-story", "main-view-state", this.state);
    }

    protected onExpertMode(expertMode: boolean)
    {
        if (expertMode !== this.state.expertMode) {
            this.storeLayout();
            this.state.expertMode = expertMode;
            this.restoreLayout();
        }
    }

    protected storeLayout()
    {
        const state = this.state;

        if (state.expertMode) {
            state.expertLayout = this.dockView.getLayout();
        }
        else {
            state.regularLayout = this.dockView.getLayout();
        }
    }

    protected restoreLayout()
    {
        const state = this.state;

        this.dockView.setLayout(state.expertMode ? state.expertLayout : state.regularLayout, this.registry);
        this.dockView.setPanelsMovable(true)
    }

    protected static readonly regularLayout: IDockElementLayout = {
        type: "strip",
        direction: "horizontal",
        size: 1,
        elements: [{
            type: "strip",
            direction: "vertical",
            size: 0.25,
            elements: [{
                type: "stack",
                size: 0.65,
                activePanelIndex: 0,
                panels: [{
                    contentId: "task",
                    text: "Task"
                }]
            }, {
                type: "stack",
                size: 0.35,
                activePanelIndex: 0,
                panels: [{
                    contentId: "log",
                    text: "Log"
                }]
            }]
        },{
            type: "stack",
            size: 0.75,
            activePanelIndex: 0,
            panels: [{
                contentId: "explorer",
                text: "Explorer"
            }]
        }]
    };

    protected static readonly expertLayout: IDockElementLayout = {
        type: "strip",
        direction: "horizontal",
        size: 1,
        elements: [{
            type: "stack",
            size: 0.22,
            activePanelIndex: 0,
            panels: [{
                contentId: "task",
                text: "Task"
            }]
        },{
            type: "strip",
            direction: "vertical",
            size: 0.56,
            elements: [{
                type: "stack",
                size: 0.8,
                activePanelIndex: 0,
                panels: [{
                    contentId: "explorer",
                    text: "Explorer"
                }]
            }, {
                type: "stack",
                size: 0.2,
                activePanelIndex: 0,
                panels: [{
                    contentId: "log",
                    text: "Log"
                }, {
                    contentId: "console",
                    text: "Console"
                }]
            }]
        }, {
            type: "strip",
            direction: "vertical",
            size: 0.22,
            elements: [{
                type: "stack",
                size: 0.5,
                activePanelIndex: 0,
                panels: [{
                    contentId: "hierarchy",
                    text: "Hierarchy"
                }]
            }, {
                type: "stack",
                size: 0.5,
                activePanelIndex: 0,
                panels: [{
                    contentId: "inspector",
                    text: "Inspector"
                }]
            }]
        }]
    };
}