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

import Commander from "@ff/core/Commander";

import { registerComponents } from "../core/system/registerComponents";
import PresentationController from "../core/controllers/PresentationController";
import RenderSystem from "../core/system/RenderSystem";
import PresentationView from "../core/views/PresentationView";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[Application]]. */
export interface IApplicationProps
{
    element: HTMLElement;
}

/**
 * Voyager prep main application.
 */
export default class Application
{
    readonly presentationController: PresentationController;

    readonly system: RenderSystem;
    protected commander: Commander;

    constructor(props: IApplicationProps)
    {
        this.system = new RenderSystem();
        registerComponents(this.system.registry);

        this.commander = new Commander();
        this.presentationController = new PresentationController(this.commander, this.system);

        // TODO: Test
        const actions = this.presentationController.actions;
        actions.load("assets/nmafa-68_23_53_textured_cm/nmafa-68_23_53_textured_cm.json");


        ReactDOM.render(
            <PresentationView
                controller={this.presentationController} />,
        props.element
    );
    }

}