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

import Node from "@ff/graph/Node";
import CPulse from "@ff/graph/components/CPulse";

import CRenderer from "@ff/scene/components/CRenderer";
import CScene from "@ff/scene/components/CScene";
import CBackground from "@ff/scene/components/CBackground";
import NCamera from "@ff/scene/nodes/NCamera";
import NDirectionalLight from "@ff/scene/nodes/NDirectionalLight";

import CVAssetLoader from "../../core/components/CVAssetLoader";
import CVOrbitNavigation from "../../core/components/CVOrbitNavigation";

import NVMiniItem from "./NVMiniItem";

////////////////////////////////////////////////////////////////////////////////

export default class NVMiniExplorer extends Node
{
    static readonly typeName: string = "NVMiniExplorer";

    protected static readonly lights = [{
        position: [-3, 1, 2], color: [1, 0.95, 0.9], intensity: 0.8
    }, {
        position: [2, 0, 3], color: [1, 1, 1], intensity: 0.8
    }, {
        position: [0, 2, -0.5], color: [1, 0.95, 0.85], intensity: 0.5
    }, {
        position: [0, -2, -1.2], color: [0.8, 0.85, 1], intensity: 1
    }];

    createComponents()
    {
        this.createComponent(CPulse);
        this.createComponent(CRenderer);

        this.createComponent(CVAssetLoader);

        const scene = this.createComponent(CScene);
        this.createScene(scene);
    }

    protected createScene(scene: CScene)
    {
        scene.node.createComponent(CBackground);
        scene.node.createComponent(CVOrbitNavigation);

        const item = scene.graph.createCustomNode(NVMiniItem);
        scene.addChild(item.transform);

        const camera = scene.graph.createCustomNode(NCamera);
        scene.addChild(camera.transform);

        const lights = NVMiniExplorer.lights;
        lights.forEach(light => {
            const node = scene.graph.createCustomNode(NDirectionalLight);
            node.transform.ins.position.setValue(light.position);
            node.light.ins.color.setValue(light.color);
            node.light.ins.intensity.setValue(light.intensity);
            scene.addChild(node.transform);
        });
    }
}