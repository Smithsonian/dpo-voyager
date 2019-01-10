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

import { types } from "@ff/graph/propertyTypes";
import { IComponentChangeEvent } from "@ff/graph/Component";
import { IComponentEvent } from "@ff/graph/ComponentSet";
import { IRenderContext } from "@ff/scene/RenderSystem";

import Camera from "@ff/scene/components/Camera";
import Scene from "@ff/scene/components/Scene";

import { IScene, EShaderMode, TShaderMode, EUnitType, TUnitType } from "common/types/voyager";

import Model, { IModelChangeEvent } from "./Model";
import OrbitNavigation from "./OrbitNavigation";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new THREE.Vector3();

export { EUnitType, EShaderMode };

export default class VoyagerScene extends Scene
{
    static readonly type: string = "VoyagerScene";

    ins = this.ins.append({
        units: types.Enum("Scene.Units", EUnitType, EUnitType.cm),
        shader: types.Enum("Renderer.Shader", EShaderMode),
        exposure: types.Number("Renderer.Exposure", 1),
        gamma: types.Number("Renderer.Gamma", 1)
    });

    boundingBox = new THREE.Box3();

    private _zoomViews = false;


    create()
    {
        this.ins.activate.path = "Scene.Activate";

        this.scene.background = new THREE.TextureLoader().load("images/bg-gradient-blue.jpg");
        this.graph.components.on(Model, this.onModelComponent, this);
    }

    update(context)
    {
        super.update(context);

        const ins = this.ins;

        if (ins.activate.changed) {
            this.system.activeCameraComponent = this.transform.getChild(Camera, true);
        }
        if (ins.units.changed) {
            this.updateModels();
        }
        if (ins.shader.changed) {
            const index = types.getEnumIndex(EShaderMode, ins.shader.value);
            this.graph.components.getArray(Model).forEach(model => model.setShaderMode(index));
        }

        return true;
    }

    preRender(context: IRenderContext): void
    {
        if (this.updated) {
            context.view.renderer.toneMappingExposure = this.ins.exposure.value;
        }
        if (this._zoomViews) {
            context.viewport.moveCameraToView(this.boundingBox);
        }
    }

    lateUpdate()
    {
        this._zoomViews = false;
    }

    zoomViews()
    {
        this._zoomViews = true;

        const manip = this.components.get(OrbitNavigation);
        manip.ins.setup.set();
    }

    fromData(data: IScene)
    {
        this.ins.copyValues({
            units: EUnitType[data.units] || EUnitType.mm,
            shader: EShaderMode[data.shader] || EShaderMode.Default,
            exposure: data.exposure !== undefined ? data.exposure : 1,
            gamma: data.gamma !== undefined ? data.gamma : 1
        });
    }

    toData(): IScene
    {
        const ins = this.ins;

        return {
            units: EUnitType[ins.units.value] as TUnitType,
            shader: EShaderMode[ins.shader.value] as TShaderMode,
            exposure: ins.exposure.value,
            gamma: ins.gamma.value
        };
    }

    protected onModelComponent(event: IComponentEvent<Model>)
    {
        if (event.add) {
            event.component.setGlobalUnits(this.ins.units.value);
            event.component.on<IModelChangeEvent>("change", this.updateModels, this);
        }
        else if (event.remove) {
            event.component.off<IModelChangeEvent>("change", this.updateModels, this);
        }
    }

    protected updateModels()
    {
        // get bounding box of all models
        const box = this.boundingBox.makeEmpty();
        const models = this.transform.getChildren(Model, true);
        const units = types.getEnumIndex(EUnitType, this.ins.units.value);

        models.forEach(model => {
            model.setGlobalUnits(units);
            box.expandByObject(model.object3D);
        });

        this.emit<IComponentChangeEvent>({
            type: "change", what: "boundingBox", component: this
        });
    }
}