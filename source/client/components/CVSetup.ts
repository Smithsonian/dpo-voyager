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

import Component, { IComponentEvent, types } from "@ff/graph/Component";
import CTransform from "@ff/scene/components/CTransform";

import { ISetup, EUnitType, TUnitType } from "common/types/setup";

import CVModel2 from "./CVModel2";

import CVInterface from "./CVInterface";
import CVViewer from "./CVViewer";
import CVReader from "./CVReader";
import CVOrbitNavigation from "./CVOrbitNavigation";
import CVBackground from "./CVBackground";
import CVFloor from "./CVFloor";
import CVGrid from "./CVGrid";
import CVTape from "./CVTape";
import CVSlicer from "./CVSlicer";
import CVTours from "./CVTours";

////////////////////////////////////////////////////////////////////////////////

/**
 * At the root of a Voyager scene, this component manages scene features,
 * including tours.
 *
 * ### Events
 * - *"bounding-box*" - emitted after the scene's model bounding box changed.
 */
export default class CVSetup extends Component
{
    static readonly typeName: string = "CVSetup";

    protected static readonly ins = {
        units: types.Enum("Scene.Units", EUnitType, EUnitType.cm),
    };

    ins = this.addInputs(CVSetup.ins);

    private _modelBoundingBox = new THREE.Box3();

    get transform() {
        return this.getComponent(CTransform);
    }
    get interface() {
        return this.getComponent(CVInterface);
    }
    get reader() {
        return this.getComponent(CVReader);
    }
    get viewer() {
        return this.getComponent(CVViewer);
    }
    get navigation() {
        return this.getComponent(CVOrbitNavigation);
    }
    get background() {
        return this.getComponent(CVBackground);
    }
    get floor() {
        return this.getComponent(CVFloor);
    }
    get grid() {
        return this.getComponent(CVGrid);
    }
    get tape() {
        return this.getComponent(CVTape);
    }
    get slicer() {
        return this.getComponent(CVSlicer);
    }
    get tours() {
        return this.getComponent(CVTours);
    }
    get models() {
        return this.getGraphComponents(CVModel2);
    }

    get modelBoundingBox() {
        return this._modelBoundingBox;
    }

    create()
    {
        super.create();

        const node = this.node;
        node.createComponent(CVInterface);
        node.createComponent(CVViewer);
        node.createComponent(CVReader);
        node.createComponent(CVOrbitNavigation);
        node.createComponent(CVBackground);
        node.createComponent(CVFloor);
        node.createComponent(CVGrid);
        node.createComponent(CVTape);
        node.createComponent(CVSlicer);
        node.createComponent(CVTours);

        this.graph.components.on(CVModel2, this.onModelComponent, this);

        this.models.forEach(model => model.ins.globalUnits.linkFrom(this.ins.units));
    }

    dispose()
    {
        this.graph.components.off(CVModel2, this.onModelComponent, this);
        super.dispose();
    }

    update(context)
    {
        const ins = this.ins;

        if (ins.units.changed) {
            this.updateModelBoundingBox();
        }

        return true;
    }

    fromData(data: ISetup)
    {
        if (!data) {
            return;
        }

        this.ins.units.setValue(EUnitType[data.units] || EUnitType.cm);

        if (data.interface) {
            this.interface.fromData(data.interface);
        }
        if (data.viewer) {
            this.viewer.fromData(data.viewer);
        }
        if (data.reader) {
            this.reader.fromData(data.reader);
        }
        if (data.navigation) {
            this.navigation.fromData(data.navigation);
        }
        if (data.background) {
            this.background.fromData(data.background);
        }
        if (data.floor) {
            this.floor.fromData(data.floor);
        }
        if (data.grid) {
            this.grid.fromData(data.grid);
        }
        if (data.tape) {
            this.tape.fromData(data.tape);
        }
        if (data.slicer) {
            this.slicer.fromData(data.slicer);
        }
        if (data.tours) {
            this.tours.fromData(data.tours);
        }
    }

    toData()
    {
        const data: ISetup = {
            units: EUnitType[this.ins.units.getValidatedValue()] as TUnitType,
        };

        data.interface = this.interface.toData();
        data.viewer = this.viewer.toData();
        data.reader = this.reader.toData();
        data.navigation = this.navigation.toData();
        data.background = this.background.toData();
        data.floor = this.floor.toData();
        data.grid = this.grid.toData();
        data.tape = this.tape.toData();
        data.slicer = this.slicer.toData();
        data.tours = this.tours.toData();

        return data;
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
        this.emit("bounding-box");
    }
}