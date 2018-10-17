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

import resolvePathname from "resolve-pathname";

import { IPublisherEvent } from "@ff/core/Publisher";
import Commander from "@ff/core/Commander";
import System from "@ff/core/ecs/System";
import Controller, { Actions } from "@ff/core/Controller";
import parseUrlParameter from "@ff/browser/parseUrlParameter";

import { IPresentation, EShaderType, EProjectionType, EViewPreset } from "common/types";

import * as template from "../templates/presentation.json";

import Presentation from "../app/Presentation";
import Item from "../app/Item";
import Loaders from "../loaders/Loaders";

import { EDerivativeQuality } from "../app/Derivative";

////////////////////////////////////////////////////////////////////////////////

export type PresentationActions = Actions<PresentationController>;

export interface IPresentationChangeEvent extends IPublisherEvent<PresentationController>
{
    current: Presentation;
    next: Presentation;
}

export default class PresentationController extends Controller<PresentationController>
{
    protected presentations: Presentation[];
    protected activePresentation: Presentation;

    protected system: System;
    protected loaders: Loaders;


    constructor(commander: Commander, system: System, loaders: Loaders)
    {
        super(commander);
        this.addEvent("change");

        this.presentations = [];
        this.activePresentation = null;

        this.system = system;
        this.loaders = loaders;
    }

    createActions(commander: Commander)
    {
        return {
            load: commander.register({
                name: "Load Presentation", do: this.loadPresentation, target: this
            }),

            setShader: commander.register({
                name: "Set Render Mode", do: this.setShader, undo: this.setState, target: this
            }),
            setProjection: commander.register({
                name: "Set Projection", do: this.setProjection, undo: this.setState, target: this
            }),
            setViewPreset: commander.register({
                name: "Set View", do: this.setViewPreset, undo: this.setState, target: this
            })
        };
    }

    getActivePresentation()
    {
        return this.activePresentation;
    }

    setActivePresentation(index: number)
    {
        const current = this.activePresentation;
        const next = this.activePresentation = this.presentations[index];

        this.emit<IPresentationChangeEvent>("change", { current, next });
    }

    loadFromDocumentUrl()
    {
        const itemUrl = parseUrlParameter("item");
        const presentationUrl = parseUrlParameter("presentation");
        const modelUrl = parseUrlParameter("model");
        const quality = parseUrlParameter("quality");

        if (itemUrl) {
            this.loadItem(itemUrl);
        }
        else if (presentationUrl) {
            this.loadPresentation(presentationUrl);
        }
        else if (modelUrl) {
            let q = EDerivativeQuality[quality];
            q = q !== undefined ? q : EDerivativeQuality.Medium;
            this.loadModel(modelUrl, q);
        }
    }

    loadModel(modelUrl: string, quality?: EDerivativeQuality, templateUrl?: string)
    {
        console.log(`Creating new item with web derivative, quality: ${EDerivativeQuality[quality]}, model url: ${modelUrl}`)
        const item = new Item(this.system, this.loaders);
        item.addWebModelDerivative(modelUrl, quality);

        const presData = template as IPresentation;
        if (!this.loaders.validator.validatePresentation(presData)) {
            throw new Error("failed to validate presentation template");
        }

        const presentation = new Presentation(this.system, this.loaders);
        presentation.inflate(presData, modelUrl, item);

        this.presentations.push(presentation);
        this.setActivePresentation(this.presentations.length - 1);
        presentation.loadModels();
    }

    loadItem(itemUrl: string, templatePath?: string)
    {
        this.loaders.loadItem(itemUrl).then(itemData => {
            const item = new Item(this.system, this.loaders);
            item.inflate(itemData, itemUrl);

            if (item.templateName) {
                const templateUrl =  resolvePathname(templatePath || itemUrl, item.templateName);
                console.log(`Loading presentation template: ${templateUrl}`);
                this.loadPresentation(templateUrl, item);
            }
            else {
                console.log("No presentation template reference found, reading default template");
                const presData = template as IPresentation;
                if (!this.loaders.validator.validatePresentation(presData)) {
                    throw new Error("failed to validate presentation template");
                }

                const presentation = new Presentation(this.system, this.loaders);
                presentation.inflate(presData, itemUrl, item);

                this.presentations.push(presentation);
                this.setActivePresentation(this.presentations.length - 1);
                presentation.loadModels();
            }
        })
        .catch(error => {
            console.warn("Failed to load item", error);
        })
    }

    loadPresentation(url: string, item?: Item)
    {
        let presentation;

        this.loaders.loadPresentation(url).then(presData => {
            presentation = new Presentation(this.system, this.loaders);
            presentation.inflate(presData, url, item);

            this.presentations.push(presentation);
            this.setActivePresentation(this.presentations.length - 1);
            presentation.loadModels();
        })
        .catch(error => {
            console.warn("Failed to load presentation", error);
        });
    }

    writePresentation(): IPresentation
    {
        return this.activePresentation.deflate();
    }

    setShader(shader: EShaderType)
    {
    }

    setProjection(index: number, projection: EProjectionType)
    {
    }

    setViewPreset(index: number, preset: EViewPreset)
    {
    }

    setState(state)
    {

    }
}