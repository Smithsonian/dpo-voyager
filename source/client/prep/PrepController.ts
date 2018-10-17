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

import Commander from "@ff/core/Commander";
import Controller, { Actions } from "@ff/core/Controller";
import { IPublisherEvent } from "@ff/core/Publisher";

import ViewManager from "../core/app/ViewManager";
import { EViewportLayoutMode } from "../core/app/ViewportLayout";

////////////////////////////////////////////////////////////////////////////////

export enum EPrepMode { Explore, Settings, Pose, Annotate }

type IPrepControllerEvent = IPublisherEvent<PrepController>;

export interface IPrepModeChangeEvent extends IPrepControllerEvent { mode: EPrepMode }


export type PrepActions = Actions<PrepController>;

export default class PrepController extends Controller<PrepController>
{
    protected viewManager: ViewManager;
    protected prepMode: EPrepMode;

    constructor(commander: Commander, viewManager: ViewManager)
    {
        super(commander);
        this.addEvents("mode");

        this.viewManager = viewManager;
        this.prepMode = EPrepMode.Explore;
    }

    get mode()
    {
        return this.prepMode;
    }

    set mode(mode: EPrepMode)
    {
        if (mode === EPrepMode.Pose) {
            this.viewManager.setViewportLayout(EViewportLayoutMode.Quad);
        }
        else {
            this.viewManager.setViewportLayout(EViewportLayoutMode.Single);
        }

        this.prepMode = mode;
        this.emit<IPrepModeChangeEvent>("mode", { mode });
    }

    createActions(commander: Commander)
    {
        return {

        };
    }

}