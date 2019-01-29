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

import CScene, { IRenderSceneContext } from "@ff/scene/components/CScene";

import { IScene, EShaderMode, TShaderMode, EUnitType, TUnitType } from "common/types/setup";

import CVModel, { IModelChangeEvent } from "./CVModel";
import CVOrbitNavigation from "./CVOrbitNavigation";

////////////////////////////////////////////////////////////////////////////////

export { EUnitType, EShaderMode };

const ins = {
    units: types.Enum("Scene.Units", EUnitType, EUnitType.cm),
    shader: types.Enum("Renderer.Shader", EShaderMode),
    exposure: types.Number("Renderer.Exposure", 1),
    gamma: types.Number("Renderer.Gamma", 1)
};

export default class CVScene extends CScene
{
    static readonly type: string = "CVScene";

    ins = this.addInputs<CScene, typeof ins>(ins);

    boundingBox = new THREE.Box3();

    private _zoomViews = false;


    create()
    {
        this.scene.background = new THREE.TextureLoader().load("images/bg-gradient-blue.jpg");
        this.graph.components.on(CVModel, this.onModelComponent, this);
    }

    update(context)
    {
        super.update(context);

        const ins = this.ins;

        if (ins.units.changed) {
            this.updateModels();
        }
        if (ins.shader.changed) {
            const index = ins.shader.getValidatedValue();
            this.graph.components.getArray(CVModel).forEach(model => model.setShaderMode(index));
        }

        return true;
    }

    beforeRender(context: IRenderSceneContext)
    {
        if (this.updated) {
            context.renderer.toneMappingExposure = this.ins.exposure.value;
        }
        if (this._zoomViews) {
            context.viewport.moveCameraToView(this.boundingBox);
        }
    }

    finalize()
    {
        this._zoomViews = false;
    }

    zoomViews()
    {
        this._zoomViews = true;

        const manip = this.system.components.get(CVOrbitNavigation);
        manip.ins.zoomExtents.set();
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

    protected onModelComponent(event: IComponentEvent<CVModel>)
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
        const models = this.transform.getChildren(CVModel, true);
        const units = this.ins.units.getValidatedValue();

        models.forEach(model => {
            model.setGlobalUnits(units);
            box.expandByObject(model.object3D);
        });

        this.emit<IComponentChangeEvent>({
            type: "change", what: "boundingBox", component: this
        });
    }
}