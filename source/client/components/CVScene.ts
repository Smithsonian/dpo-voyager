/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import { IComponentEvent, ITypedEvent, types } from "@ff/graph/Component";

import { EUnitType, TUnitType } from "client/schema/common";
import { IDocument, IScene } from "client/schema/document";

import CVNode from "./CVNode";
import CVModel2 from "./CVModel2";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new THREE.Vector3();

/**
 * Manages the scene and the nodes in the scene tree.
 *
 *  * ### Events
 * - *"bounding-box*" - emitted after the scene's model bounding box changed.
 */
export default class CVScene extends CVNode
{
    static readonly typeName: string = "CVScene";

    static readonly text: string = "Scene";
    static readonly icon: string = "hierarchy";

    protected static readonly ins = {
        units: types.Enum("Scene.Units", EUnitType, EUnitType.cm),
        modelUpdated: types.Event("Scene.ModelUpdated"),
    };

    protected static readonly outs = {
        boundingBox: types.Object("Models.BoundingBox", THREE.Box3),
        boundingRadius: types.Number("Models.BoundingRadius"),
    };

    ins = this.addInputs<CVNode, typeof CVScene.ins>(CVScene.ins);
    outs = this.addOutputs<CVNode, typeof CVScene.outs>(CVScene.outs);


    get settingProperties() {
        return null;
    }

    get snapshotProperties() {
        return null;
    }

    get models() {
        return this.getGraphComponents(CVModel2);
    }

    create()
    {
        super.create();

        this.outs.boundingBox.setValue(new THREE.Box3());

        this.graph.components.on(CVModel2, this.onModelComponent, this);

        this.models.forEach(model => {
            model.ins.globalUnits.linkFrom(this.ins.units);
            this.ins.modelUpdated.linkFrom(model.outs.updated);
        });
    }

    update(context)
    {
        const ins = this.ins;

        if (ins.units.changed) {
            this.updateModelBoundingBox();
        }
        if (ins.modelUpdated.changed) {
            this.updateModelBoundingBox();
        }

        return true;
    }

    dispose()
    {
        this.graph.components.off(CVModel2, this.onModelComponent, this);
        super.dispose();
    }

    fromDocument(document: IDocument, scene: IScene)
    {
        this.ins.units.setValue(EUnitType[scene.units] || 0);
    }

    toDocument(document: IDocument, scene: IScene)
    {
        scene.units = EUnitType[this.ins.units.getValidatedValue()] as TUnitType;
    }

    protected onModelComponent(event: IComponentEvent<CVModel2>)
    {
        const model = event.object;

        if (event.add) {
            model.ins.globalUnits.linkFrom(this.ins.units);
            this.ins.modelUpdated.linkFrom(model.outs.updated);
        }

        this.updateModelBoundingBox();
    }

    protected updateModelBoundingBox()
    {
        if (ENV_DEVELOPMENT) {
            console.log("CVScene.updateModelBoundingBox");
        }

        const box = this.outs.boundingBox.value;
        box.makeEmpty();

        this.models.forEach(model => box.expandByObject(model.object3D));
        box.getSize(_vec3);

        this.outs.boundingBox.set();
        this.outs.boundingRadius.setValue(_vec3.length() * 0.5);
    }
}