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

import types from "@ff/core/ecs/propertyTypes";

import Controller, { Actions, Commander } from "./Controller";

import ViewportManager, { EViewportLayout, IViewportManip } from "../app/ViewportManager";
import ExplorerView from "../views/ExplorerView";

import RenderSystem from "../app/RenderSystem";
import RenderContext from "../app/RenderContext";

////////////////////////////////////////////////////////////////////////////////

export { EViewportLayout };

interface IViewEntry
{
    view: ExplorerView;
    manager: ViewportManager;
}

export type ViewportActions = Actions<ViewportController>;

export default class ViewportController extends Controller<ViewportController>
{
    static readonly type: string = "ViewportController";

    ins = this.makeProps({
    });

    actions: ViewportActions = null;

    protected context: RenderContext = new RenderContext();
    protected views: IViewEntry[] = [];

    protected layoutMode: EViewportLayout = EViewportLayout.Single;
    protected nextManip: IViewportManip = null;

    createActions(commander: Commander)
    {
        const actions = {
        };

        this.actions = actions;
        return actions;
    }

    renderViews(scene: THREE.Scene, sceneCamera: THREE.Camera)
    {
        const context = this.context;

        this.views.forEach(entry => {
            const { view, manager } = entry;
            if (!view) {
                return;
            }

            view.renderer.clear();

            manager.forEachViewport((viewport, index) => {
                viewport.sceneCamera = sceneCamera;
                viewport.updateCamera();
                const camera = viewport.camera;
                context.set(viewport, camera, scene);

                (this.system as RenderSystem).preRender(context);
                viewport.render(view.renderer, scene);
                (this.system as RenderSystem).postRender(context);
            });
        });
    }

    setViewportLayout(layout: EViewportLayout)
    {
        this.layoutMode = layout;

        this.views.forEach(entry => {
            entry.manager.layout = layout;
        });
    }

    setNextManip(manip: IViewportManip)
    {
        this.nextManip = manip;

        this.views.forEach(entry => {
            entry.manager.next = manip;
        });
    }

    /**
     * Called by a view after it has been created/mounted.
     * @param {ExplorerView} view
     * @returns {string}
     */
    registerView(view: ExplorerView): ViewportManager
    {
        const orphanEntry = this.views.find(entry => entry.view === null);

        if (orphanEntry) {
            orphanEntry.view = view;
            return orphanEntry.manager;
        }

        const manager = new ViewportManager();

        manager.setCanvasSize(view.canvasWidth, view.canvasHeight);
        manager.next = this.nextManip;
        manager.layout = this.layoutMode;

        const entry = {
            manager,
            view
        };

        this.views.push(entry);

        return manager;
    }

    /**
     * Called by a view before it is unmounted.
     * @param {ExplorerView} view
     */
    unregisterView(view: ExplorerView)
    {
        const entry = this.views.find(entry => entry.view === view);

        if (!entry) {
            throw new Error("view not found");
        }

        entry.view = null;
    }
}