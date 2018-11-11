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

import "./application.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import DockController from "@ff/react/DockController";

import StoryAppController from "./components/StoryAppController";
import SelectionController from "./components/SelectionController";
import AnnotationsEditController from "./components/AnnotationsEditController";
import ToursEditController from "./components/ToursEditController";
import PoseEditController from "./components/PoseEditController";

import PoseManip from "./components/PoseManip";
import ViewportCameraManip from "./components/ViewportCameraManip";

import { registerComponents } from "./registerComponents";
import MainView from "./views/MainView";

import BaseApplication, { IApplicationProps } from "../core/app/BaseApplication";

////////////////////////////////////////////////////////////////////////////////

/**
 * Voyager prep main application.
 */
export default class PrepApplication extends BaseApplication
{
    readonly dockableController: DockController;
    readonly selectionController: SelectionController;
    readonly prepController: StoryAppController;

    protected annotationsEditController: AnnotationsEditController;
    protected toursEditController: ToursEditController;
    protected poseController: PoseEditController;

    protected poseManip: PoseManip;
    protected viewportCameraManip: ViewportCameraManip;

    constructor(props: IApplicationProps)
    {
        console.log("Voyager Story");

        super();
        registerComponents(this.registry);

        this.selectionController = this.main.createComponent(SelectionController);
        this.selectionController.createActions(this.commander);

        this.prepController = this.main.createComponent(StoryAppController);
        this.prepController.createActions(this.commander);

        this.annotationsEditController = this.main.createComponent(AnnotationsEditController);
        this.annotationsEditController.createActions(this.commander);

        this.toursEditController = this.main.createComponent(ToursEditController);
        this.toursEditController.createActions(this.commander);

        this.poseManip = this.main.createComponent(PoseManip);
        this.poseController = this.main.createComponent(PoseEditController);
        this.poseController.createActions(this.commander);

        this.dockableController = new DockController(this.commander);

        this.viewportCameraManip = this.main.createComponent(ViewportCameraManip);

        this.orbitManip.next.component = this.poseManip;
        this.poseManip.next.component = this.viewportCameraManip;

        this.start();
        this.parseArguments(props);

        ReactDOM.render(
            <MainView
                application={this} />,
            props.element
        );
    }
}

window["Voyager"] = PrepApplication;