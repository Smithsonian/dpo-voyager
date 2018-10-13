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

import System from "@ff/core/ecs/System";
import Entity from "@ff/core/ecs/Entity";
import Container from "@ff/react/Container";
import { IManipEventHandler, IManipPointerEvent, IManipTriggerEvent } from "@ff/react/ManipTarget";

import { IPresentation } from "common/types/presentation";

import Transform from "../components/Transform";
import Model from "../components/Model";
import Scene from "../components/Scene";
import MainCamera from "../components/MainCamera";
import ViewportLayout from "../components/ViewportLayout";
import OrbitManip from "../components/OrbitManip";
import PickManip from "../components/PickManip";

import PresentationParser from "../loaders/PresentationParser";
import * as presentationTemplate from "../templates/presentation.json";

import UpdateContext from "../system/UpdateContext";
import RenderContext, { IRenderable } from "../system/RenderContext";
import AssetLoader from "../loaders/AssetLoader";

////////////////////////////////////////////////////////////////////////////////

export default class PresentationSystem extends System implements IManipEventHandler
{
    readonly loadingManager: THREE.LoadingManager;

    protected main: Entity;
    protected presentations: Entity[];
    protected assetLoader: AssetLoader;

    protected updateContext: UpdateContext;
    protected renderContext: RenderContext;


    constructor()
    {
        super();

        this.loadingManager = new THREE.LoadingManager();

        this.main = this.createEntity("Main");
        this.main.createComponent(ViewportLayout);

        this.presentations = [];
        this.assetLoader = new AssetLoader(this.loadingManager);

        this.updateContext = new UpdateContext();
        this.renderContext = new RenderContext();
    }

    openPresentation(presentation: IPresentation, assetPath: string)
    {
        const entity = this.createEntity(name || "Presentation");
        this.presentations.push(entity);

        return Promise.resolve().then(() => {
            PresentationParser.inflate(entity, presentation);
            PresentationParser.inflate(entity, presentationTemplate as IPresentation, true);
            return this.waitForUpdate();

        }).then(() => {
            const scene = entity.getComponent(Scene);
            const layoutManip = this.main.getComponent(ViewportLayout);
            const pickManip = entity.getComponent(PickManip);
            const orbitManip = scene.getComponentInSubtree(OrbitManip);

            layoutManip.next.component = pickManip;
            pickManip.next.component = orbitManip;

            // attach light group to orbit rotation
            const lights = this.findEntityByName("Lights");
            if (lights) {
                const transform = lights.getComponent(Transform);
                transform.in("Order").setValue(4);
                transform.in("Rotation").linkFrom(orbitManip.out("Inverse.Orbit"));
            }

            // load models
            const models = this.getComponents(Model);
            models.forEach(model => {
                model.setAssetLoader(this.assetLoader, assetPath);
                model.load("medium");
            });

            // switch viewport
            layoutManip.setValue("Layout", 3);
        });
    }

    renderLayout(renderer: THREE.WebGLRenderer, container: Container)
    {
        renderer.clear();

        const sceneComponent = this.getComponent(Scene);
        if (!sceneComponent) {
            return;
        }

        this.updateContext.advance();

        this.update(this.updateContext);
        this.tick(this.updateContext);

        const mainCameraComponent = this.getComponent(MainCamera);
        const sceneCamera = mainCameraComponent && mainCameraComponent.activeCamera;

        const viewportLayout = this.getComponent(ViewportLayout);
        viewportLayout.forEachViewport(viewport => {
            viewport.sceneCamera = sceneCamera;
            this.renderContext.viewport = viewport;
            //this.render(this.renderContext);
            viewport.render(renderer, sceneComponent.scene);
        });
    }

    // render(context: RenderContext)
    // {
    //     const components = this.getComponents();
    //
    //     for (let i = 0, n = components.length; i < n; ++i) {
    //         const component = components[i] as IRenderable;
    //         if (component.render) {
    //             component.render(context);
    //         }
    //     }
    // }

    setCanvasSize(width: number, height: number)
    {
        const viewportLayout = this.getComponent(ViewportLayout);
        viewportLayout.setCanvasSize(width, height);
    }

    onPointer(event: IManipPointerEvent)
    {
        const manip = this.getComponent(ViewportLayout);
        return manip.onPointer(event);
    }

    onTrigger(event: IManipTriggerEvent)
    {
        const manip = this.getComponent(ViewportLayout);
        return manip.onTrigger(event);
    }
}