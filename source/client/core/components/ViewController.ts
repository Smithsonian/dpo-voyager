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

import { EShaderType, EViewPreset } from "common/types";

import PresentationController from "../components/PresentationController";
import Presentation from "../app/Presentation";

import { EProjectionType } from "./Camera";

import Controller, { Actions, Commander } from "./Controller";

////////////////////////////////////////////////////////////////////////////////

export type ViewActions = Actions<ViewController>;

export default class ViewController extends Controller<ViewController>
{
    static readonly type: string = "ViewController";

    protected explorerController: PresentationController = null;
    protected presentation: Presentation = null;

    create()
    {
        super.create();
        this.explorerController = this.system.getComponent(PresentationController);
        this.explorerController.on("presentation", this.onPresentationChange, this);
    }

    dispose()
    {
        this.explorerController.off("presentation", this.onPresentationChange, this);
        super.dispose();
    }

    get shaderType()
    {
        return EShaderType.Default;
    }

    get projectionType()
    {
        return EProjectionType.Perspective;
    }

    get viewPreset()
    {
        return EViewPreset.Top;
    }

    createActions(commander: Commander)
    {
        return {
            setShader: commander.register({
                name: "Set Render Mode", do: this.setShaderType, target: this
            }),
            setProjection: commander.register({
                name: "Set Projection", do: this.setProjectionType, target: this
            }),
            setViewPreset: commander.register({
                name: "Set View", do: this.setViewPreset, target: this
            })
        };
    }

    protected onPresentationChange(presentation: Presentation)
    {
        this.presentation = presentation;
    }

    protected setShaderType(shader: EShaderType)
    {

    }

    protected setProjectionType(index: number, projection: EProjectionType)
    {

    }

    protected setViewPreset(index: number, preset: EViewPreset)
    {
    }
}

