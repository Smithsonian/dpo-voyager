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

import ViewportLayout, { EViewportLayoutMode, IViewportManip } from "../app/ViewportLayout";
import VoyagerView from "../views/VoyagerView";

import RenderSystem from "./RenderSystem";
import RenderContext from "./RenderContext";

////////////////////////////////////////////////////////////////////////////////

interface IViewEntry
{
    view: VoyagerView;
    viewportLayout: ViewportLayout;
}

export default class ViewManager
{
    protected system: RenderSystem;
    protected context: RenderContext = new RenderContext();
    protected views: IViewEntry[] = [];

    protected layoutMode: EViewportLayoutMode = EViewportLayoutMode.Single;
    protected nextManip: IViewportManip = null;

    constructor(system: RenderSystem)
    {
        this.system = system;
    }

    renderViews(scene: THREE.Scene, sceneCamera: THREE.Camera)
    {
        const context = this.context;

        this.views.forEach(entry => {
            const { view, viewportLayout } = entry;
            if (!view) {
                return;
            }

            view.renderer.setClearColor("#0080a0");
            view.renderer.clear();

            viewportLayout.forEachViewport((viewport, index) => {
                viewport.sceneCamera = sceneCamera;
                viewport.updateCamera();
                const camera = viewport.camera;
                context.set(viewport, camera, scene);
                this.system.render(context);
                viewport.render(view.renderer, scene);
            });
        });
    }

    setViewportLayout(layout: EViewportLayoutMode)
    {
        this.layoutMode = layout;

        this.views.forEach(entry => {
            entry.viewportLayout.layoutMode = layout;
        });
    }

    setNextManip(manip: IViewportManip)
    {
        this.nextManip = manip;

        this.views.forEach(entry => {
            entry.viewportLayout.next = manip;
        });
    }

    /**
     * Called by a view after it has been created/mounted.
     * @param {VoyagerView} view
     * @returns {string}
     */
    registerView(view: VoyagerView): ViewportLayout
    {
        const orphanEntry = this.views.find(entry => entry.view === null);

        if (orphanEntry) {
            orphanEntry.view = view;
            return orphanEntry.viewportLayout;
        }

        const viewportLayout = new ViewportLayout();

        viewportLayout.setCanvasSize(view.canvasWidth, view.canvasHeight);
        viewportLayout.next = this.nextManip;
        viewportLayout.layoutMode = this.layoutMode;

        const entry = {
            viewportLayout,
            view
        };

        this.views.push(entry);

        return viewportLayout;
    }

    /**
     * Called by a view before it is unmounted.
     * @param {VoyagerView} view
     */
    unregisterView(view: VoyagerView)
    {
        const entry = this.views.find(entry => entry.view === view);

        if (!entry) {
            throw new Error("view not found");
        }

        entry.view = null;
    }
}