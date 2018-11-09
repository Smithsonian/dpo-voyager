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

import { IPublisherEvent } from "@ff/core/ecs/Component";

import Renderer, { EViewportLayout } from "../../core/components/Renderer";
import StoryAppController, { IPrepModeChangeEvent, EPrepMode } from "./StoryAppController";

import Controller, { Actions, Commander } from "../../core/components/Controller";
import Explorer from "../../core/components/Explorer";
import SystemController from "../../core/components/SystemController";

////////////////////////////////////////////////////////////////////////////////

export enum EPoseEditMode { Off, Select, Translate, Rotate, Scale }

export interface IPoseEditModeEvent extends IPublisherEvent<PoseEditController>
{
    mode: EPoseEditMode;
}

export type PoseActions = Actions<PoseEditController>;

export default class PoseEditController extends Controller<PoseEditController>
{
    static readonly type: string = "PoseEditController";
    static readonly isSystemSingleton: boolean = true;

    actions: PoseActions = null;

    protected mode: EPoseEditMode = EPoseEditMode.Off;

    protected systemController: SystemController = null;
    protected appController: StoryAppController = null;
    protected renderer: Renderer = null;


    constructor(id?: string)
    {
        super(id);
        this.addEvents("change", "mode");
    }

    create()
    {
        super.create();

        this.systemController = this.getComponent(SystemController);

        this.appController = this.getComponent(StoryAppController);
        this.appController.on("mode", this.onPrepMode, this);

        this.renderer = this.getComponent(Renderer);
    }

    dispose()
    {
        this.appController.off("mode", this.onPrepMode, this);

        super.dispose();
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
        this.emit<IPoseEditModeEvent>("mode", { mode });
    }

    protected onPrepMode(event: IPrepModeChangeEvent)
    {
        if (event.mode === EPrepMode.Pose) {
            this.systemController.actions.setInputValue(Explorer, "Annotations.Enabled", false);
            this.setMode(EPoseEditMode.Select);
            this.renderer.setViewportLayout(EViewportLayout.Quad);
        }
        else {
            this.setMode(EPoseEditMode.Off);
            this.renderer.setViewportLayout(EViewportLayout.Single);
        }
    }
}