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
import parseUrlParameter from "@ff/browser/parseUrlParameter";

import Commander from "@ff/core/Commander";
import Entity from "@ff/core/ecs/Entity";

import { IPresentation, IItem } from "common/types/presentation";
import AssetLoader from "../loaders/AssetLoader";
import JSONLoader from "../loaders/JSONLoader";
import PresentationValidator from "../loaders/PresentationValidator";
import PresentationParser from "../loaders/PresentationParser";
import * as template from "../templates/presentation.json";

import Scene from "../components/Scene";
import Camera from "../components/Camera";
import Model from "../components/Model";

import Controller, { Actions } from "../components/Controller";
import { IComponentChangeEvent } from "@ff/core/ecs/Component";

////////////////////////////////////////////////////////////////////////////////

export type RenderMode = "standard" | "clay" | "normals" | "wireframe" | "x-ray";
export type ProjectionMode = "perspective" | "orthographic";
export type ViewPreset = "left" | "right" | "top" | "bottom" | "front" | "back";

export type PresentationActions = Actions<PresentationController>;

export interface IPresentationChangeEvent extends IComponentChangeEvent<PresentationController>
{
    what: "presentation";
    presentation: IPresentationEntry;
}

export interface IPresentationEntry
{
    entity: Entity;
    sceneComponent: Scene;
    cameraComponent: Camera;
    lightsEntity: Entity;
}

export default class PresentationController extends Controller<PresentationController>
{
    static readonly type: string = "PresentationController";

    public actions: PresentationActions;

    private presentations: IPresentationEntry[] = [];
    private activePresentation: IPresentationEntry = null;

    private jsonLoader: JSONLoader = null;
    private assetLoader: AssetLoader = null;
    private validator = new PresentationValidator();

    setLoadingManager(loadingManager: THREE.LoadingManager)
    {
        this.jsonLoader = new JSONLoader(loadingManager);
        this.assetLoader = new AssetLoader(loadingManager);
    }

    createActions(commander: Commander)
    {
        const actions = {
            load: commander.register({
                name: "Load Presentation", do: this.loadPresentation, target: this
            }),

            setRenderMode: commander.register({
                name: "Set Render Mode", do: this.setRenderMode, undo: this.setState, target: this
            }),
            setProjection: commander.register({
                name: "Set Projection", do: this.setProjection, undo: this.setState, target: this
            }),
            setViewPreset: commander.register({
                name: "Set View", do: this.setViewPreset, undo: this.setState, target: this
            })
        };

        this.actions = actions;
        return actions;
    }

    getActivePresentation()
    {
        return this.activePresentation;
    }

    setActivePresentation(index: number)
    {
        const presentation = this.activePresentation = this.presentations[index];
        this.emit<IPresentationChangeEvent>("change", { what: "presentation", presentation });
    }

    loadFromLocationUrl()
    {
        const item = parseUrlParameter("item");
        const presentation = parseUrlParameter("presentation");

        if (item) {
            this.loadItem(item, presentation);
        }
        else if (presentation) {
            this.loadPresentation(presentation);
        }
    }

    loadItem(itemUrl: string, templateUrl?: string)
    {
        const assetPath = resolvePathname(".", itemUrl);

        this.jsonLoader.load(itemUrl)
            .then(json => {
                if (!this.validator.validateItem(json)) {
                    throw new Error(`failed to validate item '${itemUrl}'`);
                }

                const itemData: IItem = json;
                const uri = itemData.story && itemData.story.templateUri;
                templateUrl = templateUrl || (uri && resolvePathname(assetPath, uri));

                if (templateUrl) {
                    console.log(`Loading presentation template: ${templateUrl}`);
                    this.loadPresentation(templateUrl, itemData);
                }
                else {
                    console.log("No presentation template reference found, reading default template");
                    const presData = template as IPresentation;
                    if (!this.validator.validatePresentation(presData)) {
                        throw new Error("failed to validate presentation template");
                    }
                    this.readPresentation(presData, itemData, assetPath);
                }
            })
            .catch(error => {
                console.warn("Failed to load item", error);
            })
    }

    loadPresentation(url: string, itemData?: IItem, assetPath?: string)
    {
        assetPath = assetPath || resolvePathname(".", url);

        this.jsonLoader.load(url)
            .then(json => {
                if (!this.validator.validatePresentation(json)) {
                    throw new Error(`failed to validate presentation '${url}'`);
                }
                this.readPresentation(json, itemData, assetPath);
            })
            .catch(error => {
                console.warn("Failed to load presentation", error);
            });
    }

    protected readItem(node: Entity, itemData: IItem)
    {
        // TODO: Implement
    }

    protected readPresentation(presData: IPresentation, itemData: IItem, assetPath: string)
    {
        const presentation = this.createEntity("Presentation");

        return Promise.resolve().then(() => {
            PresentationParser.inflate(presentation, presData, itemData);
            //PresentationParser.inflate(presentation, presentationTemplate as IPresentation, true);
            return this.system.waitForUpdate();

        }).then(() => {
            const sceneComponent = presentation.getComponent(Scene);
            const cameraComponent = sceneComponent.getComponentInSubtree(Camera);
            const lightsEntity = sceneComponent.findEntityInSubtree("Lights");

            // create entry for presentation
            this.presentations.push({
                entity: presentation,
                sceneComponent,
                cameraComponent,
                lightsEntity
            });

            this.setActivePresentation(this.presentations.length - 1);

            // load models
            const models = sceneComponent.getComponentsInSubtree(Model);
            models.forEach(model => {
                model.setAssetLoader(this.assetLoader, assetPath);
                model.load("medium");
            });
        });
    }

    writePresentation(): IPresentation
    {
        const presentation = this.activePresentation.entity;
        return PresentationParser.deflate(presentation);
    }

    setRenderMode(renderMode: RenderMode)
    {
    }

    setProjection(index: number, projection: ProjectionMode)
    {
    }

    setViewPreset(index: number, preset: string)
    {
    }

    setState(state)
    {

    }
}