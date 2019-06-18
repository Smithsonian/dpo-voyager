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

export interface IBoundingBoxEvent extends ITypedEvent<"bounding-box">
{
    boundingBox: THREE.Box3;
}

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
    };

    ins = this.addInputs<CVNode, typeof CVScene.ins>(CVScene.ins);


    get settingProperties() {
        return null;
    }

    get snapshotProperties() {
        return null;
    }

    get models() {
        return this.getGraphComponents(CVModel2);
    }

    private _modelBoundingBox = new THREE.Box3();

    getModelBoundingBox(forceUpdate: boolean)
    {
        if (forceUpdate) {
            this.updateModelBoundingBox();
        }

        return this._modelBoundingBox;
    }

    create()
    {
        super.create();
        this.graph.components.on(CVModel2, this.onModelComponent, this);
        this.models.forEach(model => model.ins.globalUnits.linkFrom(this.ins.units));
    }

    update(context)
    {
        const ins = this.ins;

        if (ins.units.changed) {
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
            model.on("bounding-box", this.updateModelBoundingBox, this);
            model.ins.globalUnits.linkFrom(this.ins.units);
        }
        if (event.remove) {
            model.off("bounding-box", this.updateModelBoundingBox, this);
        }

        this.updateModelBoundingBox();
    }

    protected updateModelBoundingBox()
    {
        const box = this._modelBoundingBox;
        box.makeEmpty();

        this.models.forEach(model => box.expandByObject(model.object3D));
        this.emit<IBoundingBoxEvent>({ type: "bounding-box", boundingBox: box });
    }
}