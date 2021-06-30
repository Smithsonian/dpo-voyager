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

import { IComponentEvent, types } from "@ff/graph/Component";

import { EUnitType, TUnitType } from "client/schema/common";
import { IDocument, IScene } from "client/schema/document";

import CVNode from "./CVNode";
import CVModel2 from "./CVModel2";
import unitScaleFactor from "client/utils/unitScaleFactor";

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
        sceneTransformed: types.Event("Scene.Transformed"),
    };

    protected static readonly outs = {
        units: types.Enum("Scene.Units", EUnitType, EUnitType.cm),
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
        const outs = this.outs;

        if (ins.units.changed) {
            this.updateTransformHierarchy();
            this.updateModelBoundingBox();
            outs.units.setValue(ins.units.value);
        }
        if (ins.modelUpdated.changed) {
            this.updateModelBoundingBox();
        }
        if (ins.sceneTransformed.changed) {
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
        this.outs.units.setValue(EUnitType[scene.units] || 0);
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
            //console.log("CVScene.updateModelBoundingBox");
        }

        const box = this.outs.boundingBox.value;
        box.makeEmpty();

        this.models.forEach(model => box.expandByObject(model.object3D));
        box.getSize(_vec3);

        this.outs.boundingBox.set();
        this.outs.boundingRadius.setValue(_vec3.length() * 0.5);
    }

    protected updateTransformHierarchy()
    {
        if(this.models.length === 0) {
            return;
        }

        const ins = this.ins;
        const outs = this.outs;
        const unitScale = unitScaleFactor(outs.units.value, ins.units.value);
        const object3D = this.models[0].object3D.parent.parent;  // TODO: Should probably crawl all the way up the hierarchy

        object3D.position.multiplyScalar(unitScale);
        object3D.updateMatrix();
        object3D.updateMatrixWorld(true);

        this.models.forEach(model => {
            const modelParent = model.object3D.parent;

            modelParent.position.multiplyScalar(unitScale);
            modelParent.updateMatrix();
            modelParent.updateMatrixWorld(true);
        });
    }
}