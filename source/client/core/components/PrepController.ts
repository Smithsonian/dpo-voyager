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

import { IPublisherEvent } from "@ff/core/Publisher";

import RenderController from "./RenderController";
import { EViewportLayoutMode } from "../app/ViewportLayout";

import PresentationController, { IPresentationChangeEvent } from "./PresentationController";
import TransformManip from "./TransformManip";

import Controller, { Actions, Commander } from "./Controller";

////////////////////////////////////////////////////////////////////////////////

export enum EPrepMode { Explore, Settings, Pose, Annotate }

type IPrepControllerEvent = IPublisherEvent<PrepController>;

export interface IPrepModeChangeEvent extends IPrepControllerEvent { mode: EPrepMode }


export type PrepActions = Actions<PrepController>;

export default class PrepController extends Controller<PrepController>
{
    static readonly type: string = "PrepController";

    actions: PrepActions = null;

    protected renderController: RenderController = null;
    protected presentationController: PresentationController = null;

    protected prepMode: EPrepMode = EPrepMode.Explore;

    create()
    {
        super.create();
        this.addEvent("mode");

        this.renderController = this.getComponent(RenderController);

        this.presentationController = this.getComponent(PresentationController);
        this.presentationController.on("presentation", this.onPresentationChange, this);
    }

    createActions(commander: Commander)
    {
        const actions = {

        };

        this.actions = actions;
        return actions;
    }

    dispose()
    {
        this.presentationController.off("presentation", this.onPresentationChange, this);
        super.dispose();
    }

    get mode()
    {
        return this.prepMode;
    }

    set mode(mode: EPrepMode)
    {
        if (mode === EPrepMode.Pose) {
            this.renderController.setViewportLayout(EViewportLayoutMode.Quad);
        }
        else {
            this.renderController.setViewportLayout(EViewportLayoutMode.Single);
        }

        this.prepMode = mode;
        this.emit<IPrepModeChangeEvent>("mode", { mode });
    }

    onPresentationChange(event: IPresentationChangeEvent)
    {
        const transformManip = this.system.getComponent(TransformManip);

        if (event.current) {
            transformManip.setScene(null);
        }

        if (event.next) {
            transformManip.setScene(event.next.scene);

            // TODO: Serialization test
            console.log("Presentation changed\n", event.next.url, "\n", event.next.path);

            //const data = this.explorerController.writePresentation();
            //console.log(JSON.stringify(data));
        }
    }
}