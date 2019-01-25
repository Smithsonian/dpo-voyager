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

import CRenderer, { IActiveSceneEvent } from "@ff/scene/components/CRenderer";
import NTransform from "@ff/scene/nodes/NTransform";

import { ISetup, INavigation, IInterface, IReader } from "common/types/setup";

import CHomeGrid from "../components/CHomeGrid";
import CBackground from "../components/CBackground";
import CGroundPlane from "../components/CGroundPlane";
import CInterface from "../components/CInterface";
import CReader from "../components/CReader";
import CTapeTool from "../components/CTapeTool";
import CSectionTool from "../components/CSectionTool";

import COrbitNavigation from "../../core/components/COrbitNavigation";
import CVoyagerScene from "../../core/components/CVoyagerScene";

////////////////////////////////////////////////////////////////////////////////

interface IGlobalExplorerData
{
    navigation: INavigation;
    interface: IInterface;
    reader: IReader;
}

export default class NPresentationSetup extends NTransform
{
    static readonly type: string = "NPresentationSetup";


    private _isActive = false;

    private _data: IGlobalExplorerData = {
        navigation: null,
        interface: null,
        reader: null
    };

    // shortcuts to access system-global components

    get renderer() {
        return this.system.graph.components.safeGet(CRenderer);
    }
    get interface() {
        return this.system.graph.components.safeGet(CInterface);
    }
    get reader() {
        return this.system.graph.components.safeGet(CReader);
    }
    get navigation() {
        return this.system.graph.components.safeGet(COrbitNavigation);
    }

    // shortcuts to access project-local components

    get scene() {
        return this.graph.components.safeGet(CVoyagerScene);
    }
    get background() {
        return this.components.safeGet(CBackground);
    }
    get groundPlane() {
        return this.components.safeGet(CGroundPlane);
    }
    get homeGrid() {
        return this.components.safeGet(CHomeGrid);
    }
    get tapeTool() {
        return this.components.safeGet(CTapeTool);
    }
    get sectionTool() {
        return this.components.safeGet(CSectionTool);
    }


    createComponents()
    {
        super.createComponents();

        this.createComponent(CBackground);
        this.createComponent(CGroundPlane);
        this.createComponent(CHomeGrid);
        this.createComponent(CTapeTool);
        this.createComponent(CSectionTool);

        this.name = "Setup";

        this.renderer.on<IActiveSceneEvent>("active-scene", this.onActiveScene, this);
    }

    dispose()
    {
        this.renderer.off<IActiveSceneEvent>("active-scene", this.onActiveScene, this);
        super.dispose();
    }

    toData(): ISetup
    {
        const data: Partial<ISetup> = {};

        if (this._isActive) {
            this._data.navigation = this.navigation.toData();
            this._data.interface = this.interface.toData();
            this._data.reader = this.reader.toData();
        }

        data.navigation = this._data.navigation;
        data.interface = this._data.interface;
        data.reader = this._data.reader;

        const navigationData = this.navigation.toData();
        if (navigationData) {
            data.navigation = navigationData;
        }
        const interfaceData = this.interface.toData();
        if (interfaceData) {
            data.interface = interfaceData;
        }
        const readerData = this.reader.toData();
        if (readerData) {
            data.reader = readerData;
        }

        const sceneData = this.scene.toData();
        if (sceneData) {
            data.scene = sceneData;
        }
        const backgroundData = this.background.toData();
        if (backgroundData) {
            data.background = backgroundData;
        }
        const planeData = this.groundPlane.toData();
        if (planeData) {
            data.groundPlane = planeData;
        }
        const gridData = this.homeGrid.toData();
        if (gridData) {
            data.grid = gridData;
        }
        const tapeToolData = this.tapeTool.toData();
        if (tapeToolData) {
            data.tapeTool = tapeToolData;
        }
        const sectionToolData = this.sectionTool.toData();
        if (sectionToolData) {
            data.sectionTool = sectionToolData;
        }

        return data as ISetup;
    }

    fromData(data: ISetup)
    {
        this._data.navigation = data.navigation ? Object.assign({}, data.navigation) : null;
        this._data.interface = data.interface ? Object.assign({}, data.interface) : null;
        this._data.reader = data.reader ? Object.assign({}, data.reader) : null;

        if (data.scene) {
            this.scene.fromData(data.scene);
        }
        if (data.background) {
            this.background.fromData(data.background);
        }
        if (data.groundPlane) {
            this.groundPlane.fromData(data.groundPlane);
        }
        if (data.grid) {
            this.homeGrid.fromData(data.grid);
        }
        if (data.tapeTool) {
            this.tapeTool.fromData(data.tapeTool);
        }
        if (data.sectionTool) {
            this.sectionTool.fromData(data.sectionTool);
        }
    }

    protected onActiveScene(event: IActiveSceneEvent)
    {
        if (event.previous && event.previous.graph === this.graph) {
            this.sceneDeactivated();
            this._isActive = false;
        }
        if (event.next && event.next.graph === this.graph) {
            this.sceneActivated();
            this._isActive = true;
        }
    }

    protected sceneActivated()
    {
        if (this._data.navigation) {
            this.navigation.fromData(this._data.navigation);
        }
        if (this._data.interface) {
            this.interface.fromData(this._data.interface);
        }
        if (this._data.reader) {
            this.reader.fromData(this._data.reader);
        }
    }

    protected sceneDeactivated()
    {
        this._data.navigation = this.navigation.toData();
        this._data.interface = this.interface.toData();
        this._data.reader = this.reader.toData();
    }
}