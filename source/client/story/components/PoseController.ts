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

import * as THREE from "three";

import ViewportController, { EViewportLayout } from "../../core/components/ViewportController";
import PrepController, { IPrepModeChangeEvent, EPrepMode } from "./PrepController";

import Controller, { Actions, Commander } from "../../core/components/Controller";

////////////////////////////////////////////////////////////////////////////////

export enum EPoseEditMode { Off, Select, Translate, Rotate, Scale }

export type PoseActions = Actions<PoseController>;

export default class PoseController extends Controller<PoseController>
{
    static readonly type: string = "PoseController";
    static readonly isSystemSingleton: boolean = true;

    actions: PoseActions = null;

    protected mode: EPoseEditMode = EPoseEditMode.Off;

    protected prepController: PrepController = null;
    protected viewportController: ViewportController = null;

    constructor(id?: string)
    {
        super(id);
        this.addEvents("change");
    }

    create()
    {
        super.create();

        this.prepController = this.getComponent(PrepController);
        this.prepController.on("mode", this.onPrepMode, this);

        this.viewportController = this.getComponent(ViewportController);
    }

    dispose()
    {
        this.prepController.off("mode", this.onPrepMode, this);
    }

    createActions(commander: Commander)
    {
        const actions = {

        };

        this.actions = actions;
        return actions;
    }

    setMode(mode: EPoseEditMode)
    {
        this.mode = mode;
        console.log("PoseController.setMode - ", EPoseEditMode[mode]);
    }

    protected onPrepMode(event: IPrepModeChangeEvent)
    {
        if (event.mode === EPrepMode.Pose) {
            this.setMode(EPoseEditMode.Select);
            this.viewportController.setViewportLayout(EViewportLayout.Quad);
        }
        else {
            this.setMode(EPoseEditMode.Off);
            this.viewportController.setViewportLayout(EViewportLayout.Single);
        }
    }
}