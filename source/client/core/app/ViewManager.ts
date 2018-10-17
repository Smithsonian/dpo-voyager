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

import { Dictionary } from "@ff/core/types";

import Manip from "../components/Manip";
import ViewportController from "../components/ViewportController";

import VoyagerView from "../views/VoyagerView";
import RenderSystem from "./RenderSystem";
import RenderContext from "./RenderContext";

////////////////////////////////////////////////////////////////////////////////

interface IViewEntry
{
    view: VoyagerView;
    controller: ViewportController;
}

export default class ViewManager
{
    protected system: RenderSystem;
    protected context: RenderContext = new RenderContext();
    protected views: Dictionary<IViewEntry> = {};
    protected viewList: IViewEntry[] = [];
    protected nextManip: Manip = null;

    constructor(system: RenderSystem)
    {
        this.system = system;
    }

    renderViews(scene: THREE.Scene, sceneCamera: THREE.Camera)
    {
        const context = this.context;

        this.viewList.forEach(entry => {
            const { view, controller } = entry;
            if (!view) {
                return;
            }

            view.renderer.clear();

            controller.forEachViewport(viewport => {
                viewport.sceneCamera = sceneCamera;
                const camera = viewport.camera;
                context.set(viewport, camera, scene);
                this.system.render(context);
                viewport.render(view.renderer, scene);
            });
        });
    }

    setNextManip(manip: Manip)
    {
        this.nextManip = manip;

        this.viewList.forEach(entry => {
            entry.controller.next.component = manip;
        });
    }

    /**
     * Called by a view after it has been created/mounted.
     * @param {VoyagerView} view
     * @returns {string}
     */
    registerView(view: VoyagerView): ViewportController
    {
        const orphanEntry = this.viewList.find(entry => entry.view === null);

        if (orphanEntry) {
            orphanEntry.view = view;
            return orphanEntry.controller;
        }

        const entity = this.system.createEntity("View");
        const controller = entity.createComponent(ViewportController);

        controller.setCanvasSize(view.canvasWidth, view.canvasHeight);
        controller.next.component = this.nextManip;

        const entry = {
            controller,
            view
        };

        this.views[controller.id] = entry;
        this.viewList.push(entry);

        return controller;
    }

    /**
     * Called by a view before it is unmounted.
     * @param {string} id
     */
    unregisterView(id: string)
    {
        const entry = this.views[id];
        if (!entry) {
            throw new Error(`unregistered view, can't remove: '${id}'`);
        }

        entry.view = null;
    }
}