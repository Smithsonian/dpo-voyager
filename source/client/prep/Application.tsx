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

import PrepController from "./components/PrepController";
import SelectionController from "./components/SelectionController";
import AnnotationsEditController from "./components/AnnotationsEditController";
import ToursEditController from "./components/ToursEditController";

import ViewportCameraManip from "./components/ViewportCameraManip";
import TransformManip from "./components/TransformManip";

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
    readonly prepController: PrepController;
    readonly annotationsEditController: AnnotationsEditController;
    readonly toursEditController: ToursEditController;

    protected transformManip: |TransformManip;
    protected viewportCameraManip: ViewportCameraManip;

    constructor(props: IApplicationProps)
    {
        console.log("Voyager Prep");

        super();
        registerComponents(this.registry);

        this.prepController = this.main.createComponent(PrepController);
        this.prepController.createActions(this.commander);

        this.selectionController = this.main.createComponent(SelectionController);
        this.selectionController.createActions(this.commander);

        this.annotationsEditController = this.main.createComponent(AnnotationsEditController);
        this.annotationsEditController.createActions(this.commander);

        this.toursEditController = this.main.createComponent(ToursEditController);
        this.toursEditController.createActions(this.commander);

        this.dockableController = new DockController(this.commander);

        this.transformManip = this.main.createComponent(TransformManip);
        this.viewportCameraManip = this.main.createComponent(ViewportCameraManip);

        this.pickManip.next.component = this.transformManip;
        this.transformManip.next.component = this.orbitManip;
        this.orbitManip.next.component = this.viewportCameraManip;

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