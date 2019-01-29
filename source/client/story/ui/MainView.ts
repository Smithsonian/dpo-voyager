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
import CVStoryController from "../components/CVStoryController";

import CustomElement, { customElement, html } from "@ff/ui/CustomElement";
import Icon from "@ff/ui/Icon";
import DockView, { DockContentRegistry, IDockElementLayout } from "@ff/ui/DockView";
import HierarchyTreeView from "@ff/ui/graph/HierarchyTreeView";

import TaskBar from "./TaskBar";
import ExplorerPanel from "./ExplorerPanel";
import TaskPanel from "./TaskPanel";
import LogPanel from "./LogPanel";
import ConsolePanel from "./ConsolePanel";
import InspectorPanel from "./InspectorPanel";

import "./styles.scss";
import NavigatorPanel from "./NavigatorPanel";

////////////////////////////////////////////////////////////////////////////////
// STORY ICONS

Icon.add("hierarchy", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M104 272h192v48h48v-48h192v48h48v-57.59c0-21.17-17.22-38.41-38.41-38.41H344v-64h40c17.67 0 32-14.33 32-32V32c0-17.67-14.33-32-32-32H256c-17.67 0-32 14.33-32 32v96c0 8.84 3.58 16.84 9.37 22.63S247.16 160 256 160h40v64H94.41C73.22 224 56 241.23 56 262.41V320h48v-48zm168-160V48h96v64h-96zm336 240h-96c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h96c17.67 0 32-14.33 32-32v-96c0-17.67-14.33-32-32-32zm-16 112h-64v-64h64v64zM368 352h-96c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h96c17.67 0 32-14.33 32-32v-96c0-17.67-14.33-32-32-32zm-16 112h-64v-64h64v64zM128 352H32c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h96c17.67 0 32-14.33 32-32v-96c0-17.67-14.33-32-32-32zm-16 112H48v-64h64v64z"/></svg>`);
Icon.add("move", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352.201 425.775l-79.196 79.196c-9.373 9.373-24.568 9.373-33.941 0l-79.196-79.196c-15.119-15.119-4.411-40.971 16.971-40.97h51.162L228 284H127.196v51.162c0 21.382-25.851 32.09-40.971 16.971L7.029 272.937c-9.373-9.373-9.373-24.569 0-33.941L86.225 159.8c15.119-15.119 40.971-4.411 40.971 16.971V228H228V127.196h-51.23c-21.382 0-32.09-25.851-16.971-40.971l79.196-79.196c9.373-9.373 24.568-9.373 33.941 0l79.196 79.196c15.119 15.119 4.411 40.971-16.971 40.971h-51.162V228h100.804v-51.162c0-21.382 25.851-32.09 40.97-16.971l79.196 79.196c9.373 9.373 9.373 24.569 0 33.941L425.773 352.2c-15.119 15.119-40.971 4.411-40.97-16.971V284H284v100.804h51.23c21.382 0 32.09 25.851 16.971 40.971z"/></svg>`);
Icon.add("camera", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M512 144v288c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V144c0-26.5 21.5-48 48-48h88l12.3-32.9c7-18.7 24.9-31.1 44.9-31.1h125.5c20 0 37.9 12.4 44.9 31.1L376 96h88c26.5 0 48 21.5 48 48zM376 288c0-66.2-53.8-120-120-120s-120 53.8-120 120 53.8 120 120 120 120-53.8 120-120zm-32 0c0 48.5-39.5 88-88 88s-88-39.5-88-88 39.5-88 88-88 88 39.5 88 88z"/></svg>`);
Icon.add("save", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M433.941 129.941l-83.882-83.882A48 48 0 0 0 316.118 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V163.882a48 48 0 0 0-14.059-33.941zM224 416c-35.346 0-64-28.654-64-64 0-35.346 28.654-64 64-64s64 28.654 64 64c0 35.346-28.654 64-64 64zm96-304.52V212c0 6.627-5.373 12-12 12H76c-6.627 0-12-5.373-12-12V108c0-6.627 5.373-12 12-12h228.52c3.183 0 6.235 1.264 8.485 3.515l3.48 3.48A11.996 11.996 0 0 1 320 111.48z"/></svg>`);
Icon.add("exit", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M497 273L329 441c-15 15-41 4.5-41-17v-96H152c-13.3 0-24-10.7-24-24v-96c0-13.3 10.7-24 24-24h136V88c0-21.4 25.9-32 41-17l168 168c9.3 9.4 9.3 24.6 0 34zM192 436v-40c0-6.6-5.4-12-12-12H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h84c6.6 0 12-5.4 12-12V76c0-6.6-5.4-12-12-12H96c-53 0-96 43-96 96v192c0 53 43 96 96 96h84c6.6 0 12-5.4 12-12z"/></svg>`);
Icon.add("expert", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M278.9 511.5l-61-17.7c-6.4-1.8-10-8.5-8.2-14.9L346.2 8.7c1.8-6.4 8.5-10 14.9-8.2l61 17.7c6.4 1.8 10 8.5 8.2 14.9L293.8 503.3c-1.9 6.4-8.5 10.1-14.9 8.2zm-114-112.2l43.5-46.4c4.6-4.9 4.3-12.7-.8-17.2L117 256l90.6-79.7c5.1-4.5 5.5-12.3.8-17.2l-43.5-46.4c-4.5-4.8-12.1-5.1-17-.5L3.8 247.2c-5.1 4.7-5.1 12.8 0 17.5l144.1 135.1c4.9 4.6 12.5 4.4 17-.5zm327.2.6l144.1-135.1c5.1-4.7 5.1-12.8 0-17.5L492.1 112.1c-4.8-4.5-12.4-4.3-17 .5L431.6 159c-4.6 4.9-4.3 12.7.8 17.2L523 256l-90.6 79.7c-5.1 4.5-5.5 12.3-.8 17.2l43.5 46.4c4.5 4.9 12.1 5.1 17 .6z"/></svg>`);

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
    static readonly stateKey: string = "main-view-state2";

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

        const story = system.components.get(CVStoryController);
        story.ins.expertMode.on("value", this.onExpertMode, this);

        const registry = this.registry = new Map();
        const explorer = this.application.explorer;
        registry.set("explorer", () => new ExplorerPanel(explorer));
        registry.set("task", () => new TaskPanel(system));
        registry.set("log", () => new LogPanel(system));
        registry.set("console", () => new ConsolePanel(system));
        registry.set("navigator", () => new NavigatorPanel(system));
        registry.set("hierarchy", () => new HierarchyTreeView(system));
        registry.set("inspector", () => new InspectorPanel(system));

        const reset = parseUrlParameter("reset") !== undefined;
        const state = reset ? null : localStorage.get("voyager-story", MainView.stateKey);

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
        localStorage.set("voyager-story", MainView.stateKey, this.state);
    }

    protected onUnload()
    {
        this.storeLayout();
        localStorage.set("voyager-story", MainView.stateKey, this.state);
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
                size: 0.2,
                activePanelIndex: 0,
                panels: [{
                    contentId: "navigator",
                    text: "Navigator"
                }]
            }, {
                type: "stack",
                size: 0.8,
                activePanelIndex: 0,
                panels: [{
                    contentId: "task",
                    text: "Task"
                }]
            }]
        }, {
            type: "strip",
            direction: "vertical",
            size: 0.75,
            elements: [{
                type: "stack",
                size: 0.75,
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
                }]
            }]
        }]
    };

    protected static readonly expertLayout: IDockElementLayout = {
        type: "strip",
        direction: "horizontal",
        size: 1,
        elements: [{
            type: "strip",
            direction: "vertical",
            size: 0.22,
            elements: [{
                type: "stack",
                size: 0.3,
                activePanelIndex: 0,
                panels: [{
                    contentId: "navigator",
                    text: "Navigator"
                }]
            }, {
                type: "stack",
                size: 0.7,
                activePanelIndex: 0,
                panels: [{
                    contentId: "task",
                    text: "Task"
                }]
            }]
        },{
            type: "strip",
            direction: "vertical",
            size: 0.56,
            elements: [{
                type: "stack",
                size: 0.5,
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