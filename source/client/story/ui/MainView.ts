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

import localStorage from "@ff/browser/localStorage";
import CustomElement, { customElement } from "@ff/ui/CustomElement";

import StoryApplication from "../Application";

import TaskController from "../controllers/TaskController";
import LogController from "../controllers/LogController";

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

interface IMainViewState
{
    layout: IDockElementLayout;
    expertMode: boolean;
}

@customElement("voyager-story")
export default class MainView extends CustomElement
{
    protected application: StoryApplication;
    protected dockView: DockView;

    protected taskController: TaskController;
    protected logController: LogController;

    protected state: IMainViewState;

    constructor(application?: StoryApplication)
    {
        super();
        this.onUnload = this.onUnload.bind(this);

        this.application = application || new StoryApplication();
        this.dockView = null;

        this.taskController = new TaskController(this.application.system, this.application.commander);
        this.logController = new LogController(this.application.system, this.application.commander);

        this.state = localStorage.get("voyager-story", "main-view-state") || {
            layout: MainView.defaultLayout,
            expertMode: true
        };
    }

    protected firstConnected()
    {
        const explorer = this.application.explorer;
        const selectionController = explorer.selectionController;

        const registry: DockContentRegistry = new Map();
        registry.set("explorer", () => new ExplorerPanel(explorer));
        registry.set("task", () => new TaskPanel(this.taskController));
        registry.set("log", () => new LogPanel(this.logController));
        registry.set("console", () => new ConsolePanel());
        registry.set("hierarchy", () => new HierarchyPanel(selectionController));
        registry.set("inspector", () => new InspectorPanel(selectionController));

        this.setStyle({
            display: "flex",
            flexDirection: "column"
        });

        this.appendElement(new TaskBar(this.taskController));

        const dockView = this.dockView = this.appendElement(DockView);
        dockView.setLayout(this.state.layout, registry);
        dockView.setPanelsMovable(true);

        window.addEventListener("beforeunload", this.onUnload);
    }

    protected onUnload()
    {
        this.state.layout = this.dockView.getLayout();
        localStorage.set("voyager-story", "main-view-state", this.state);
    }

    protected static readonly defaultLayout: IDockElementLayout = {
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