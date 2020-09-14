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

import { Dictionary } from "@ff/core/types";
import Component from "@ff/graph/Component";
import CTransform from "@ff/scene/components/CTransform";

import { IDocument, IScene } from "client/schema/document";
import { ISetup } from "client/schema/setup";

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

////////////////////////////////////////////////////////////////////////////////

/**
 * At the root of a Voyager scene, this component manages scene features,
 * including tours.
 */
export default class CVSetup extends Component
{
    static readonly typeName: string = "CVSetup";

    protected static readonly featureMap = {
        "interface": CVInterface,
        "reader": CVReader,
        "viewer": CVViewer,
        "navigation": CVOrbitNavigation,
        "background": CVBackground,
        "environment": CVEnvironment,
        "floor": CVFloor,
        "grid": CVGrid,
        "tape": CVTape,
        "slicer": CVSlicer,
        "tours": CVTours,
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
    background: CVBackground;
    floor: CVFloor;
    grid: CVGrid;
    tape: CVTape;
    slicer: CVSlicer;
    tours: CVTours;
    snapshots: CVSnapshots;
    environment: CVEnvironment;

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

    fromDocument(document: IDocument, sceneIndex: number, pathMap: Map<string, Component>)
    {
        const scene = document.scenes[sceneIndex];

        if (!isFinite(scene.setup)) {
            throw new Error("setup property missing in node");
        }

        const setupData = document.setups[scene.setup];
        const features = CVSetup.featureMap;

        for (const name in features) {
            pathMap.set(`scenes/${sceneIndex}/setup/${name}`, this[name]);

            const featureData = setupData[name];
            if (featureData) {
                this[name].fromData(featureData);
            }
        }

        if (setupData.snapshots) {
            this.snapshots.fromData(setupData.snapshots, pathMap);
        }
    }

    toDocument(document: IDocument, sceneIndex: number, pathMap: Map<Component, string>)
    {
        let setupData: ISetup = null;
        const features = CVSetup.featureMap;

        for (const name in features) {
            pathMap.set(this[name], `scenes/${sceneIndex}/setup/${name}`);

            const featureData = this[name].toData();
            if (featureData) {
                setupData = setupData || {};
                setupData[name] = featureData;
            }
        }

        const snapshotData = this.snapshots.toData(pathMap);
        if (snapshotData) {
            setupData = setupData || {};
            setupData.snapshots = snapshotData;
        }

        if (setupData) {
            document.setups = document.setups || [];
            const index = document.setups.length;
            document.setups.push(setupData);
            document.scenes[sceneIndex].setup = index;
        }
    }
}