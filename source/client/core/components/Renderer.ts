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

import Component from "@ff/core/ecs/Component";
import types from "@ff/core/ecs/propertyTypes";

import { IRenderer, TShaderType } from "common/types";

import ViewportManager, { EViewportLayout, IViewportManip } from "../app/ViewportManager";
import RenderSystem from "../app/RenderSystem";
import RenderContext from "../app/RenderContext";

import { EShaderMode } from "../shaders/UberMaterial";
import ExplorerView from "../views/ExplorerView";
import Model from "./Model";
import Scene from "./Scene";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();

export { EViewportLayout, EShaderMode };

interface IViewEntry
{
    view: ExplorerView;
    manager: ViewportManager;
}

export default class Renderer extends Component
{
    static readonly type: string = "Renderer";

    ins = this.makeProps({
        grd: types.Boolean("HomeGrid.Enabled"),
        sha: types.Enum("Shader", EShaderMode, EShaderMode.Default),
        exp: types.Number("Exposure", 1),
        gam: types.Number("Gamma", 1),
    });

    protected context: RenderContext = new RenderContext();
    protected views: IViewEntry[] = [];

    protected layoutMode: EViewportLayout = EViewportLayout.Single;
    protected nextManip: IViewportManip = null;

    protected boundingBox = new THREE.Box3().makeEmpty();
    protected globalScalingEnabled: boolean = true;
    protected globalScalingFactor = 1;

    get globalScaling()
    {
        return this.globalScalingFactor;
    }

    update()
    {
        const { grd, sha, exp, gam } = this.ins;

        if (grd.changed) {
            this.views.forEach(entry => {
                entry.manager.enableHomeGrid(grd.value);
            });
        }

        if (sha.changed) {
            const index = types.getEnumEntry(EShaderMode, sha.value);
            this.system.getComponents(Model).forEach(model => model.setShaderMode(index));
        }

        if (exp.changed) {
            this.views.forEach(entry => {
                entry.view.renderer.toneMappingExposure = exp.value;
            });
        }

        if (gam.changed) {
            this.views.forEach(entry => {
                entry.view.renderer.gammaFactor = gam.value;
            });
        }
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

                //const scale = this.globalScalingFactor;
                //_mat4.makeScale(scale, scale, scale);
                //camera.matrix.multiply(_mat4);
                //camera.matrixWorldNeedsUpdate = true;

                //scene.updateMatrix();
                //scene.matrix.multiply(_mat4);

                context.set(viewport, camera, scene);

                (this.system as RenderSystem).preRender(context);
                viewport.render(view.renderer, scene);
                (this.system as RenderSystem).postRender(context);
            });
        });
    }

    updateBoundingBox(model: Model)
    {
        this.boundingBox.expandByObject(model.object3D);

        if (this.globalScalingEnabled) {
            this.boundingBox.getSize(_vec3);
            this.globalScalingFactor = 20 / Math.max(_vec3.x, _vec3.y, _vec3.z);

            console.log("Renderer.updateBoundingBox - set global scaling to ",
                this.globalScalingFactor);
        }
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

    fromData(data: IRenderer)
    {
        this.ins.setValues({
            sha: EShaderMode[data.shader],
            exp: data.exposure,
            gam: data.gamma
        });
    }

    toData(): IRenderer
    {
        const { sha, exp, gam } = this.ins;

        return {
            shader: EShaderMode[sha.value] as TShaderType,
            exposure: exp.value,
            gamma: gam.value
        };
    }
}