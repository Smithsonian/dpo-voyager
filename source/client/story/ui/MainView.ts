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

import HierarchyTreeView from "@ff/scene/ui/HierarchyTreeView";

import TaskBar from "./TaskBar";
import ExplorerPanel from "./ExplorerPanel";
import EditorPanel from "./EditorPanel";
import TaskPanel from "./TaskPanel";
import NotePadPanel from "./NotePadPanel";
import ConsolePanel from "./ConsolePanel";
import InspectorPanel from "./InspectorPanel";
import AssetPanel from "./AssetPanel";

import "./styles.scss";
import NavigatorPanel from "./NavigatorPanel";

////////////////////////////////////////////////////////////////////////////////
// STORY ICONS

Icon.add("hierarchy", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M104 272h192v48h48v-48h192v48h48v-57.59c0-21.17-17.22-38.41-38.41-38.41H344v-64h40c17.67 0 32-14.33 32-32V32c0-17.67-14.33-32-32-32H256c-17.67 0-32 14.33-32 32v96c0 8.84 3.58 16.84 9.37 22.63S247.16 160 256 160h40v64H94.41C73.22 224 56 241.23 56 262.41V320h48v-48zm168-160V48h96v64h-96zm336 240h-96c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h96c17.67 0 32-14.33 32-32v-96c0-17.67-14.33-32-32-32zm-16 112h-64v-64h64v64zM368 352h-96c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h96c17.67 0 32-14.33 32-32v-96c0-17.67-14.33-32-32-32zm-16 112h-64v-64h64v64zM128 352H32c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h96c17.67 0 32-14.33 32-32v-96c0-17.67-14.33-32-32-32zm-16 112H48v-64h64v64z"/></svg>`);
Icon.add("select", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M302.189 329.126H196.105l55.831 135.993c3.889 9.428-.555 19.999-9.444 23.999l-49.165 21.427c-9.165 4-19.443-.571-23.332-9.714l-53.053-129.136-86.664 89.138C18.729 472.71 0 463.554 0 447.977V18.299C0 1.899 19.921-6.096 30.277 5.443l284.412 292.542c11.472 11.179 3.007 31.141-12.5 31.141z"/></svg>`);
Icon.add("create", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"/></svg>`);
Icon.add("move", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M360.549 412.216l-96.064 96.269c-4.686 4.686-12.284 4.686-16.971 0l-96.064-96.269c-4.686-4.686-4.686-12.284 0-16.971l19.626-19.626c4.753-4.753 12.484-4.675 17.14.173L230 420.78h2V280H91.22v2l44.986 41.783c4.849 4.656 4.927 12.387.173 17.14l-19.626 19.626c-4.686 4.686-12.284 4.686-16.971 0L3.515 264.485c-4.686-4.686-4.686-12.284 0-16.971l96.269-96.064c4.686-4.686 12.284-4.686 16.97 0l19.626 19.626c4.753 4.753 4.675 12.484-.173 17.14L91.22 230v2H232V91.22h-2l-41.783 44.986c-4.656 4.849-12.387 4.927-17.14.173l-19.626-19.626c-4.686-4.686-4.686-12.284 0-16.971l96.064-96.269c4.686-4.686 12.284-4.686 16.971 0l96.064 96.269c4.686 4.686 4.686 12.284 0 16.971l-19.626 19.626c-4.753 4.753-12.484 4.675-17.14-.173L282 91.22h-2V232h140.78v-2l-44.986-41.783c-4.849-4.656-4.927-12.387-.173-17.14l19.626-19.626c4.686-4.686 12.284-4.686 16.971 0l96.269 96.064c4.686 4.686 4.686 12.284 0 16.971l-96.269 96.064c-4.686 4.686-12.284 4.686-16.971 0l-19.626-19.626c-4.753-4.753-4.675-12.484.173-17.14L420.78 282v-2H280v140.78h2l41.783-44.986c4.656-4.849 12.387-4.927 17.14-.173l19.626 19.626c4.687 4.685 4.687 12.283 0 16.969z"/></svg>`);
Icon.add("rotate", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M370.72 133.28C339.458 104.008 298.888 87.962 255.848 88c-77.458.068-144.328 53.178-162.791 126.85-1.344 5.363-6.122 9.15-11.651 9.15H24.103c-7.498 0-13.194-6.807-11.807-14.176C33.933 94.924 134.813 8 256 8c66.448 0 126.791 26.136 171.315 68.685L463.03 40.97C478.149 25.851 504 36.559 504 57.941V192c0 13.255-10.745 24-24 24H345.941c-21.382 0-32.09-25.851-16.971-40.971l41.75-41.749zM32 296h134.059c21.382 0 32.09 25.851 16.971 40.971l-41.75 41.75c31.262 29.273 71.835 45.319 114.876 45.28 77.418-.07 144.315-53.144 162.787-126.849 1.344-5.363 6.122-9.15 11.651-9.15h57.304c7.498 0 13.194 6.807 11.807 14.176C478.067 417.076 377.187 504 256 504c-66.448 0-126.791-26.136-171.315-68.685L48.97 471.03C33.851 486.149 8 475.441 8 454.059V320c0-13.255 10.745-24 24-24z"/></svg>`);
Icon.add("compress", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M436 192H312c-13.3 0-24-10.7-24-24V44c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v84h84c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12zm-276-24V44c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v84H12c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h124c13.3 0 24-10.7 24-24zm0 300V344c0-13.3-10.7-24-24-24H12c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h84v84c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12zm192 0v-84h84c6.6 0 12-5.4 12-12v-40c0-6.6-5.4-12-12-12H312c-13.3 0-24 10.7-24 24v124c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12z"/></svg>`);
Icon.add("camera", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M512 144v288c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V144c0-26.5 21.5-48 48-48h88l12.3-32.9c7-18.7 24.9-31.1 44.9-31.1h125.5c20 0 37.9 12.4 44.9 31.1L376 96h88c26.5 0 48 21.5 48 48zM376 288c0-66.2-53.8-120-120-120s-120 53.8-120 120 53.8 120 120 120 120-53.8 120-120zm-32 0c0 48.5-39.5 88-88 88s-88-39.5-88-88 39.5-88 88-88 88 39.5 88 88z"/></svg>`);
Icon.add("save", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M433.941 129.941l-83.882-83.882A48 48 0 0 0 316.118 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V163.882a48 48 0 0 0-14.059-33.941zM224 416c-35.346 0-64-28.654-64-64 0-35.346 28.654-64 64-64s64 28.654 64 64c0 35.346-28.654 64-64 64zm96-304.52V212c0 6.627-5.373 12-12 12H76c-6.627 0-12-5.373-12-12V108c0-6.627 5.373-12 12-12h228.52c3.183 0 6.235 1.264 8.485 3.515l3.48 3.48A11.996 11.996 0 0 1 320 111.48z"/></svg>`);
Icon.add("exit", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M497 273L329 441c-15 15-41 4.5-41-17v-96H152c-13.3 0-24-10.7-24-24v-96c0-13.3 10.7-24 24-24h136V88c0-21.4 25.9-32 41-17l168 168c9.3 9.4 9.3 24.6 0 34zM192 436v-40c0-6.6-5.4-12-12-12H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h84c6.6 0 12-5.4 12-12V76c0-6.6-5.4-12-12-12H96c-53 0-96 43-96 96v192c0 53 43 96 96 96h84c6.6 0 12-5.4 12-12z"/></svg>`);
Icon.add("expert", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M278.9 511.5l-61-17.7c-6.4-1.8-10-8.5-8.2-14.9L346.2 8.7c1.8-6.4 8.5-10 14.9-8.2l61 17.7c6.4 1.8 10 8.5 8.2 14.9L293.8 503.3c-1.9 6.4-8.5 10.1-14.9 8.2zm-114-112.2l43.5-46.4c4.6-4.9 4.3-12.7-.8-17.2L117 256l90.6-79.7c5.1-4.5 5.5-12.3.8-17.2l-43.5-46.4c-4.5-4.8-12.1-5.1-17-.5L3.8 247.2c-5.1 4.7-5.1 12.8 0 17.5l144.1 135.1c4.9 4.6 12.5 4.4 17-.5zm327.2.6l144.1-135.1c5.1-4.7 5.1-12.8 0-17.5L492.1 112.1c-4.8-4.5-12.4-4.3-17 .5L431.6 159c-4.6 4.9-4.3 12.7.8 17.2L523 256l-90.6 79.7c-5.1 4.5-5.5 12.3-.8 17.2l43.5 46.4c4.5 4.9 12.1 5.1 17 .6z"/></svg>`);
Icon.add("pen", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M290.74 93.24l128.02 128.02-277.99 277.99-114.14 12.6C11.35 513.54-1.56 500.62.14 485.34l12.7-114.22 277.9-277.88zm207.2-19.06l-60.11-60.11c-18.75-18.75-49.16-18.75-67.91 0l-56.55 56.55 128.02 128.02 56.55-56.55c18.75-18.76 18.75-49.16 0-67.91z"/></svg>`);
Icon.add("folder", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M464 128H272l-64-64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V176c0-26.51-21.49-48-48-48z"/></svg>`);

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
    static readonly stateKey: string = "main-view-state3";

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
                document: this.getAttribute("document"),
                presentation: this.getAttribute("presentation"),
                item: this.getAttribute("item"),
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

        window["voyagerStory"] = this.application;

        this.dockView = null;

        const system = this.application.system;

        const story = system.components.get(CVStoryController);
        story.ins.expertMode.on("value", this.onExpertMode, this);

        const registry = this.registry = new Map();
        const explorer = this.application.explorer;
        registry.set("explorer", () => new ExplorerPanel(explorer));
        registry.set("editor", () => new EditorPanel(system));
        registry.set("task", () => new TaskPanel(system));
        registry.set("notes", () => new NotePadPanel(system));
        registry.set("console", () => new ConsolePanel(system));
        registry.set("navigator", () => new NavigatorPanel(system));
        registry.set("hierarchy", () => new HierarchyTreeView(system));
        registry.set("inspector", () => new InspectorPanel(system));
        registry.set("assets", () => new AssetPanel(system));

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
            size: 0.22,
            elements: [{
                type: "stack",
                size: 0.2,
                activePanelIndex: 0,
                panels: [{
                    contentId: "navigator",
                    text: "Navigator"
                }, {
                    contentId: "assets",
                    text: "Assets"
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
            size: 0.78,
            elements: [{
                type: "stack",
                size: 0.85,
                activePanelIndex: 0,
                panels: [{
                    contentId: "explorer",
                    text: "Explorer"
                }, {
                    contentId: "editor",
                    text: "Editor"
                }]
            }, {
                type: "stack",
                size: 0.15,
                activePanelIndex: 0,
                panels: [{
                    contentId: "notes",
                    text: "Notes"
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
            size: 0.2,
            elements: [{
                type: "stack",
                size: 0.3,
                activePanelIndex: 0,
                panels: [{
                    contentId: "navigator",
                    text: "Navigator"
                }, {
                    contentId: "assets",
                    text: "Assets"
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
            size: 0.6,
            elements: [{
                type: "stack",
                size: 0.8,
                activePanelIndex: 0,
                panels: [{
                    contentId: "explorer",
                    text: "Explorer"
                }, {
                    contentId: "editor",
                    text: "Editor"
                }]
            }, {
                type: "stack",
                size: 0.2,
                activePanelIndex: 0,
                panels: [{
                    contentId: "notes",
                    text: "Notes"
                }, {
                    contentId: "console",
                    text: "Console"
                }]
            }]
        }, {
            type: "strip",
            direction: "vertical",
            size: 0.2,
            elements: [{
                type: "stack",
                size: 0.6,
                activePanelIndex: 0,
                panels: [{
                    contentId: "hierarchy",
                    text: "Hierarchy"
                }]
            }, {
                type: "stack",
                size: 0.4,
                activePanelIndex: 0,
                panels: [{
                    contentId: "inspector",
                    text: "Inspector"
                }]
            }]
        }]
    };
}