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
import { IComponentChangeEvent, IComponentEvent } from "@ff/graph/Component";

import CObject3D, { IRenderContext } from "@ff/scene/components/CObject3D";

import { IScene, EShaderMode, TShaderMode, EUnitType, TUnitType } from "common/types/features";

import CVModel_old, { IModelChangeEvent } from "./CVModel_old";
import CVOrbitNavigation from "./CVOrbitNavigation";
import CVAnnotations_old from "../../explorer/components/CVAnnotations_old";
import CScene from "@ff/scene/components/CScene";

////////////////////////////////////////////////////////////////////////////////

export { EUnitType, EShaderMode };

const ins = {
    units: types.Enum("Scene.Units", EUnitType, EUnitType.cm),
    annotationsVisible: types.Boolean("Annotations.Visible", false),
    shader: types.Enum("Renderer.Shader", EShaderMode),
    exposure: types.Number("Renderer.Exposure", 1),
    gamma: types.Number("Renderer.Gamma", 1),
    zoomExtents: types.Event("Viewports.ZoomExtents")
};

export default class CVScene_old extends CObject3D
{
    static readonly typeName: string = "CVScene_old";

    ins = this.addInputs<CObject3D, typeof ins>(ins);

    boundingBox = new THREE.Box3();

    //private _scene: CScene = null;
    private _zoomExtents = false;


    // get activeCameraComponent() {
    //     return this._scene.activeCameraComponent;
    // }

    create()
    {
        super.create();
        //this._scene = this.scene;
        this.graph.components.on(CVModel_old, this.onModelComponent, this);
    }

    update(context)
    {
        super.update(context);

        const ins = this.ins;

        if (ins.units.changed) {
            this.updateModels();
        }
        if (ins.annotationsVisible.changed) {
            const visible = ins.annotationsVisible.value;
            this.getGraphComponents(CVAnnotations_old).forEach(comp => comp.ins.visible.setValue(visible));
        }
        if (ins.shader.changed) {
            const shader = ins.shader.getValidatedValue();
            this.getGraphComponents(CVModel_old).forEach(model => model.ins.shader.setValue(shader));
        }
        if (ins.zoomExtents.changed) {
            this._zoomExtents = true;
            const manip = this.system.components.get(CVOrbitNavigation);
            if (manip) {
                manip.ins.zoomExtents.set();
            }
        }

        return true;
    }

    preRender(context: IRenderContext)
    {
        if (this.updated) {
            context.renderer.toneMappingExposure = this.ins.exposure.value;
        }
        if (this._zoomExtents) {
            context.viewport.zoomExtents(this.boundingBox);
        }
    }

    complete()
    {
        this._zoomExtents = false;
    }

    fromData(data: IScene)
    {
        data = data || {} as IScene;

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

    protected onModelComponent(event: IComponentEvent<CVModel_old>)
    {
        if (event.add) {
            event.object.setGlobalUnits(this.ins.units.value);
            event.object.on<IModelChangeEvent>("change", this.updateModels, this);
        }
        else if (event.remove) {
            event.object.off<IModelChangeEvent>("change", this.updateModels, this);
        }
    }

    updateBoundingBox(): THREE.Box3
    {
        // get bounding box of all models
        const box = this.boundingBox.makeEmpty();
        const models = this.getGraphComponents(CVModel_old);
        const units = this.ins.units.getValidatedValue();

        models.forEach(model => {
            model.setGlobalUnits(units);
            box.expandByObject(model.object3D);
        });

        return box;
    }

    protected updateModels()
    {
        // get bounding box of all models
        const box = this.boundingBox.makeEmpty();
        const models = this.getGraphComponents(CVModel_old);
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