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

import { IPresentation } from "common/types/presentation";

import Scene from "../components/Scene";
import Camera from "../components/Camera";
import Model from "../components/Model";

import AssetLoader from "../loaders/AssetLoader";
import PresentationLoader from "../loaders/PresentationLoader";
import PresentationParser from "../loaders/PresentationParser";

import * as presentationTemplate from "../templates/presentation.json";

import Controller, { Actions } from "../components/Controller";
import { IComponentChangeEvent } from "@ff/core/ecs/Component";

////////////////////////////////////////////////////////////////////////////////

export type RenderMode = "standard" | "clay" | "normals" | "wireframe" | "x-ray";
export type ProjectionMode = "perspective" | "orthographic";

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

    private presentations: IPresentationEntry[] = [];
    private activePresentation: IPresentationEntry = null;

    private presentationLoader: PresentationLoader = null;
    private assetLoader: AssetLoader = null;

    setLoadingManager(loadingManager: THREE.LoadingManager)
    {
        this.presentationLoader = new PresentationLoader(loadingManager);
        this.assetLoader = new AssetLoader(loadingManager);
    }

    createActions(commander: Commander)
    {
        return this.actions = {
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
        // TODO: Implement
    }

    loadPresentation(url: string)
    {
        this.presentationLoader.load(url)
            .then(presentationData => {
                this.openPresentation(presentationData, resolvePathname(".", url));
            })
            .catch(error => {
                console.warn("Failed to load presentation", error);
            });
    }

    openPresentation(data: IPresentation, assetPath: string)
    {
        const presentation = this.createEntity("Presentation");

        return Promise.resolve().then(() => {
            PresentationParser.inflate(presentation, data);
            PresentationParser.inflate(presentation, presentationTemplate as IPresentation, true);
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