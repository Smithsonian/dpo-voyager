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

import { IPresentationChangeEvent } from "../core/controllers/PresentationController";
import SelectionController, { ISelectComponentEvent } from "../core/controllers/SelectionController";
import { IPickManipPickEvent } from "../core/components/PickManip";
import ViewportCameraManip from "../core/components/ViewportCameraManip";
import TransformManip from "../core/components/TransformManip";
import Model from "../core/components/Model";

import { registerComponents } from "./registerComponents";
import MainView from "./MainView";

import PrepController from "./PrepController";

import VoyagerApplication, { IVoyagerApplicationProps } from "../core/app/VoyagerApplication";

////////////////////////////////////////////////////////////////////////////////

/**
 * Voyager prep main application.
 */
export default class Application extends VoyagerApplication
{
    readonly dockableController: DockController;
    readonly selectionController: SelectionController;
    readonly prepController: PrepController;

    protected transformManip: |TransformManip;
    protected viewportCameraManip: ViewportCameraManip;

    constructor(props: IVoyagerApplicationProps)
    {
        super(props);
        registerComponents(this.registry);

        this.dockableController = new DockController(this.commander);

        this.selectionController = new SelectionController(this.commander, this.system);
        this.prepController = new PrepController(this.commander, this.viewManager);

        this.transformManip = this.main.createComponent(TransformManip);
        this.viewportCameraManip = this.main.createComponent(ViewportCameraManip);

        this.pickManip.next.component = this.transformManip;
        this.transformManip.next.component = this.orbitManip;
        this.orbitManip.next.component = this.viewportCameraManip;

        this.pickManip.on("up", (event: IPickManipPickEvent) => {
            this.selectionController.actions.select(event.component, event.pointerEvent.ctrlKey);
        });

        this.selectionController.on("component", (event: ISelectComponentEvent) => {
            if (event.component.is(Model)) {
                this.transformManip.setTarget(event.component as Model);
            }
        });

        this.start();
        this.presentationController.loadFromDocumentUrl();

        ReactDOM.render(
            <MainView
                application={this} />,
            props.element
        );
    }

    protected onPresentationChange(event: IPresentationChangeEvent)
    {
        super.onPresentationChange(event);

        if (event.current) {
            this.transformManip.setScene(null);
        }

        if (event.next) {
            this.transformManip.setScene(event.next.scene);

            // TODO: Serialization test
            const data = this.presentationController.writePresentation();
            console.log(JSON.stringify(data));
        }
    }
}