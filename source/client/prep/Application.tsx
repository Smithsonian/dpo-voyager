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

import * as React from "react";
import * as ReactDOM from "react-dom";

import DockController from "@ff/react/DockController";


import VoyagerApplication, { IVoyagerApplicationProps } from "../core/system/VoyagerApplication";
import HierarchyController from "../core/components/HierarchyController";

import { registerComponents } from "./registerComponents";
import MainView from "./MainView";

////////////////////////////////////////////////////////////////////////////////

/**
 * Voyager prep main application.
 */
export default class Application extends VoyagerApplication
{
    readonly dockableController: DockController;
    readonly hierarchyController: HierarchyController;

    constructor(props: IVoyagerApplicationProps)
    {
        super(props);
        registerComponents(this.registry);

        this.dockableController = new DockController(this.commander);
        this.hierarchyController = this.main.createComponent(HierarchyController);

        // assets/nmafa-68_23_53_textured_cm/nmafa-68_23_53_textured_cm.json

        this.start();
        this.presentationController.loadFromLocationUrl();

        ReactDOM.render(
            <MainView
                application={this} />,
            props.element
        );
    }

}