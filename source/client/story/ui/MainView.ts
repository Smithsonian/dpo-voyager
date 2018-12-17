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

import DockView, { DockContentRegistry } from "@ff/ui/DockView";
import CustomElement, { customElement } from "@ff/ui/CustomElement";

import StoryApplication from "../Application";

import ExplorerView from "../../explorer/ui/MainView";
import HierarchyView from "./HierarchyView";
import InspectorView from "./InspectorView";

import "./styles.scss";

////////////////////////////////////////////////////////////////////////////////

@customElement("voyager-story")
export default class MainView extends CustomElement
{
    protected application: StoryApplication;

    constructor(application?: StoryApplication)
    {
        super();

        this.application = application || new StoryApplication();
    }

    firstConnected()
    {
        const explorer = this.application.explorer;
        const selectionController = explorer.selectionController;
        const registry: DockContentRegistry = new Map();

        registry.set("explorer", () => new ExplorerView(explorer));
        registry.set("hierarchy", () => new HierarchyView(selectionController));
        registry.set("inspector", () => new InspectorView(selectionController));

        const dockView = this.appendElement(DockView, {
            position: "absolute",
            top: "0", left: "0", bottom: "0", right: "0"
        });

        dockView.setLayout({
            type: "strip",
            direction: "horizontal",
            size: 1,
            elements: [{
                type: "stack",
                size: 0.7,
                activePanelIndex: 0,
                panels: [{
                    contentId: "explorer",
                    text: "Explorer"
                }]
            }, {
                type: "strip",
                direction: "vertical",
                size: 0.3,
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
        }, registry);

        dockView.setPanelsMovable(true);
    }
}