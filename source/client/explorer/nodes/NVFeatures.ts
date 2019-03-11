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

import CVNavigation from "../../core/components/CVNavigation";
import CVOrbitNavigation from "../../core/components/CVOrbitNavigation";

import CVFeatures from "../components/CVFeatures";
import CVBackground from "../components/CVBackground";
import CVFloor from "../components/CVFloor";
import CVGrid from "../components/CVGrid";
import CVTape from "../components/CVTape";

import CVSliceTool from "../components/CVSliceTool";
import CVInterface from "../components/CVInterface";
import CVReader from "../components/CVReader";
import CVTours from "../components/CVTours";

////////////////////////////////////////////////////////////////////////////////

export default class NVFeatures extends NTransform
{
    static readonly typeName: string = "NVFeatures";

    get features() {
        return this.getComponent(CVFeatures);
    }
    get navigation() {
        return this.getComponent(CVNavigation);
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

    createComponents()
    {
        super.createComponents();

        const tours = this.getGraphComponent(CVTours);

        this.createComponent(CVFeatures);

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
}