/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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

import Component, { types } from "@ff/graph/Component";
import CTransform from "@ff/scene/components/CTransform";

import { IDocument } from "client/schema/document";
import { ISetup } from "client/schema/setup";
import { ELanguageType } from "client/schema/common";

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
import CVSnapshots from "./CVSnapshots";
import CVEnvironment from "./CVEnvironment";
import CVLanguageManager from "./CVLanguageManager";
import CVAudioManager from "./CVAudioManager";
import CVDerivativesController from "./CVDerivativesController";
import CVActionManager from "./CVActionManager";

////////////////////////////////////////////////////////////////////////////////

/**
 * At the root of a Voyager scene, this component manages scene features,
 * including tours.
 */
export default class CVSetup extends Component
{
    static readonly typeName: string = "CVSetup";

    private _savedSetupData: ISetup = {};

    protected static readonly ins = {
        saveState: types.Event("Setup.SaveState"),
        restoreState: types.Event("Setup.RestoreState"),
    };

    ins = this.addInputs(CVSetup.ins);

    protected static readonly featureMap = {
        "interface": CVInterface,
        "reader": CVReader,
        "viewer": CVViewer,
        "navigation": CVOrbitNavigation,
        "derivatives": CVDerivativesController, 
        "background": CVBackground,
        "environment": CVEnvironment,
        "language": CVLanguageManager,
        "floor": CVFloor,
        "grid": CVGrid,
        "tape": CVTape,
        "slicer": CVSlicer,
        "tours": CVTours,
        "audio": CVAudioManager,
        "actions": CVActionManager
    };

    get featureMap() {
        return (this.constructor as typeof CVSetup).featureMap;
    }
    get transform() {
        return this.getComponent(CTransform);
    }

    interface: CVInterface;
    reader: CVReader;
    viewer: CVViewer;
    navigation: CVOrbitNavigation;
    derivatives: CVDerivativesController;
    background: CVBackground;
    floor: CVFloor;
    grid: CVGrid;
    tape: CVTape;
    slicer: CVSlicer;
    tours: CVTours;
    snapshots: CVSnapshots;
    environment: CVEnvironment;
    language: CVLanguageManager;
    audio: CVAudioManager;
    actions: CVActionManager;

    create()
    {
        super.create();

        const node = this.node;
        const features = CVSetup.featureMap;

        for (const name in features) {
            this[name] = node.createComponent(features[name]);
        }

        this.snapshots = node.createComponent(CVSnapshots);
    }

    dispose()
    {
        this._savedSetupData = null;

        const features = CVSetup.featureMap;
        for (const name in features) {
            this[name] = null;
        }
        this.snapshots = null;

        super.dispose();
    }

    update()
    {
        const ins = this.ins;

        if (ins.saveState.changed) {
            this.cacheSetupState();
        }
        if (ins.restoreState.changed) {
            this.restoreSetupState();
        }
        
        return true;
    }

    fromDocument(document: IDocument, sceneIndex: number, pathMap: Map<string, Component>)
    {
        const scene = document.scenes[sceneIndex];

        const setupData = document.setups?.[scene.setup] ?? {};
        this._savedSetupData = JSON.parse(JSON.stringify(setupData));
        const features = CVSetup.featureMap;

        for (const name in features) {
            pathMap.set(`scenes/${sceneIndex}/setup/${name}`, this[name]);

            const featureData = setupData[name];
            if (featureData) {
                this[name].fromData(featureData);
            }
            else {
                this[name].ins.properties.forEach((prop) => prop.changed = !prop.schema.event);
            }
        }
    }

    toDocument(document: IDocument, sceneIndex: number, pathMap: Map<Component, string>)
    {
        const setupData: ISetup = this._savedSetupData;
        const features = CVSetup.featureMap;

        for (const name in features) {
            pathMap.set(this[name], `scenes/${sceneIndex}/setup/${name}`);
        }

        // save current tours state (or remove cached if current is empty)
        const tourData = this["tours"].toData();
        if (tourData) {
            setupData["tours"] = tourData;
        }
        else if (setupData["tours"]) {
            delete setupData["tours"];
        }

        const snapshotData = this.snapshots.toData(pathMap);
        if (snapshotData) {
            setupData.snapshots = snapshotData;
        }

        if (setupData) {
            document.setups = document.setups || [];
            const index = document.setups.length;
            document.setups.push(setupData);
            document.scenes[sceneIndex].setup = index;
        }
    }

    // Caches current setup state for future saving.
    protected cacheSetupState()
    {
        const features = CVSetup.featureMap;

        for (const name in features) {
            const featureData = this[name].toData();
            if (featureData) {
                this._savedSetupData[name] = featureData;
            }
        }
        this.language.ins.primarySceneLanguage.setValue(ELanguageType[this._savedSetupData.language.language]);
    }

    // Restores cached setup state for future saving.
    protected restoreSetupState()
    {
        const cachedData = this._savedSetupData;
        const features = CVSetup.featureMap;

        for (const name in features) {
            const featureData = cachedData[name];
            if (featureData && name !== "tours") {
                this[name].fromData(featureData);
            }
        }

        this.slicer.ins.enabled.set();  // slicer needs a push to refresh
        if(this.navigation.ins.autoZoom.value) {
            this.navigation.ins.zoomExtents.set();
        }
    }

    resetViewer() {
        this.actions.ins.reset.set();
        this.audio.ins.reset.set();
        this.navigation.ins.projection.reset();  // projection not currently included in scene state
        this.ins.restoreState.set();
    }
}