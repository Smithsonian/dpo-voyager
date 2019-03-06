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

import Component from "@ff/graph/Component";
import CRenderer from "@ff/scene/components/CRenderer";

import { IFeatures } from "common/types/features";

import CVNavigation from "../../core/components/CVOrbitNavigation";
import CVOrbitNavigation from "../../core/components/CVOrbitNavigation";

import CVInterface from "./CVInterface";
import CVReader from "./CVReader";
import CVTapeTool from "./CVTapeTool";
import CVSliceTool from "./CVSliceTool";

import CVScene from "../../core/components/CVScene";
import CVBackground from "./CVBackground";
import CVFloor from "./CVFloor";
import CVGrid from "./CVGrid";
import CVTape from "./CVTape";

////////////////////////////////////////////////////////////////////////////////

export default class CVFeatures extends Component
{
    static readonly typeName: string = "CVFeatures";

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

    // accessors for document-local components

    get scene() {
        return this.getGraphComponent(CVScene);
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

    create()
    {
        super.create();
    }

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

    dispose()
    {
        super.dispose();
    }

    fromData(data: IFeatures)
    {
        this.data = data;

        if (this.graph.isActive) {
            this.inflateGlobalComponents();
        }

        this.scene.fromData(data.scene);
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

        data.scene = this.scene.toData();
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