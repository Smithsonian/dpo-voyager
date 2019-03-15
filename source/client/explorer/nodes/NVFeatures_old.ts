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

import NTransform from "@ff/scene/nodes/NTransform";

import { IFeatures } from "common/types/features";

import CVOrbitNavigation from "../../core/components/CVOrbitNavigation";

import CVInterface from "../components/CVInterface";
import CVReader from "../components/CVReader";
import CVSliceTool from "../components/CVSliceTool";
import CVTours from "../components/CVTours";

import CVScene_old from "../../core/components/CVScene_old";
import CVBackground from "../components/CVBackground";
import CVFloor from "../components/CVFloor";
import CVGrid from "../components/CVGrid";
import CVTape from "../components/CVTape";

////////////////////////////////////////////////////////////////////////////////

export default class NVFeatures_old extends NTransform
{
    static readonly typeName: string = "NVFeatures_old";

    protected data: IFeatures = null;

    // accessors for system-global components

    get interface() {
        return this.getMainComponent(CVInterface);
    }
    get reader() {
        return this.getMainComponent(CVReader);
    }
    get sliceTool() {
        return this.getMainComponent(CVSliceTool);
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

    // TODO: Read/write global components
    activate()
    {
        if (this.data) {
            this.inflateGlobalComponents();
        }
    }

    deactivate()
    {
        if (this.data) {
            this.deflateGlobalComponents();
        }
    }

    createComponents()
    {
        super.createComponents();

        const tours = this.getGraphComponent(CVTours);

        const navigation = this.createComponent(CVOrbitNavigation, "Navigation", "nav");
        const background = this.createComponent(CVBackground, "Background", "bg");
        const floor = this.createComponent(CVFloor, "Floor", "floor");
        const grid = this.createComponent(CVGrid, "Grid", "grid");
        const tape = this.createComponent(CVTape, "Tape", "tape");

        // Snapshot, document-local properties
        tours.addTarget(navigation, navigation.ins.orbit);
        tours.addTarget(navigation, navigation.ins.offset);

        tours.addTarget(background, background.ins.style);
        tours.addTarget(background, background.ins.color0);
        tours.addTarget(background, background.ins.color1);

        tours.addTarget(floor, floor.ins.opacity);

        tours.addTarget(grid, grid.ins.visible);

        tours.addTarget(tape, tape.ins.visible);
        tours.addTarget(tape, tape.ins.startPosition);
        tours.addTarget(tape, tape.ins.startDirection);
        tours.addTarget(tape, tape.ins.endPosition);
        tours.addTarget(tape, tape.ins.endDirection);

        // Snapshot, global properties
        const iface = this.getMainComponent(CVInterface);

        const reader = this.getMainComponent(CVReader);

        const slice = this.getMainComponent(CVSliceTool);
        tours.addTarget(slice, slice.ins.enabled);
        tours.addTarget(slice, slice.ins.axis);
        tours.addTarget(slice, slice.ins.inverted);
        tours.addTarget(slice, slice.ins.position);
        tours.addTarget(slice, slice.ins.color);
    }

    fromData(data: IFeatures)
    {
        this.data = data;

        if (this.graph.isActive) {
            this.inflateGlobalComponents();
        }

        this.navigation.fromData(data.navigation);
        this.background.fromData(data.background);
        this.floor.fromData(data.floor);
        this.grid.fromData(data.grid);
        this.tape.fromData(data.tapeTool);
    }

    toData(): IFeatures
    {
        const data: IFeatures = this.data = {};

        if (this.graph.isActive) {
            this.deflateGlobalComponents();
        }

        data.navigation = this.navigation.toData();
        data.background = this.background.toData();
        data.floor = this.floor.toData();
        data.grid = this.grid.toData();
        data.tapeTool = this.tape.toData();

        return data;
    }

    protected inflateGlobalComponents()
    {
        const data = this.data;
        this.interface.fromData(data.interface);
        this.reader.fromData(data.reader);
        this.sliceTool.fromData(data.sliceTool);
    }

    protected deflateGlobalComponents()
    {
        const data = this.data;
        data.interface = this.interface.toData();
        data.reader = this.reader.toData();
        data.sliceTool = this.sliceTool.toData();
    }
}