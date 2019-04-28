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

import { IDocument, IScene } from "common/types/document";

import NVNode, { INodeComponents } from "./NVNode";

import CVScene from "../components/CVScene";
import CVSetup from "../components/CVSetup";
import CVMeta from "../components/CVMeta";
import Component from "@ff/graph/Component";
import CLight from "@ff/scene/components/CLight";
import CDirectionalLight from "@ff/scene/components/CDirectionalLight";

////////////////////////////////////////////////////////////////////////////////

export default class NVScene extends NVNode
{
    static readonly typeName: string = "NVScene";

    get setup() {
        return this.components.get(CVSetup, true);
    }

    createComponents()
    {
        this.createComponent(CVScene);
        this.createComponent(CVSetup);
        this.createComponent(CVMeta);
    }

    fromDocument(document: IDocument, sceneIndex: number, pathMap: Map<string, Component>)
    {
        const scene = document.scenes[sceneIndex];

        if (scene.name) {
            this.name = scene.name;
        }

        this.scene.fromDocument(document, scene);

        // serialize node tree
        const nodeIndices = scene.nodes;
        if (nodeIndices) {
            nodeIndices.forEach(nodeIndex => {
                const childNode = this.graph.createCustomNode(NVNode);
                this.transform.addChild(childNode.transform);
                childNode.fromDocument(document, nodeIndex, pathMap);
            });
        }

        // serialize additional scene components
        if (isFinite(scene.meta)) {
            this.meta.fromDocument(document, scene);
            pathMap.set(`meta/${scene.meta}`, this.meta);
        }
        if (isFinite(scene.setup)) {
            this.setup.fromDocument(document, sceneIndex, pathMap);
        }

        // enable shadow casting for first light source
        const lights = this.getGraphComponents(CLight) as CDirectionalLight[];
        const light0 = lights[0];
        const light1 = lights[1];

        if (light0) {
            light0.ins.shadowEnabled.setValue(true);
            light0.ins.shadowSize.setValue(1000);
        }
        if (light1) {
            light1.ins.shadowEnabled.setValue(true);
            light1.ins.shadowSize.setValue(1000);
        }
    }

    toDocument(document: IDocument, pathMap: Map<Component, string>, components?: INodeComponents): number
    {
        document.scenes = document.scenes || [];
        const sceneIndex = document.scenes.length;
        const scene: IScene = { units: "cm" };
        document.scenes.push(scene);

        if (this.name) {
            scene.name = this.name;
        }

        this.scene.toDocument(document, scene);

        // serialize node tree
        const children = this.transform.children
            .map(child => child.node).filter(node => node.is(NVNode)) as NVNode[];

        children.forEach(child => {
            if (child.hasNodeComponents(components)) {
                const index = child.toDocument(document, pathMap, components);
                scene.nodes = scene.nodes || [];
                scene.nodes.push(index);
            }
        });

        // serialize additional scene components
        if (!components || components.setup) {
            if (this.meta) {
                scene.meta = this.meta.toDocument(document, scene);
                pathMap.set(this.meta, `meta/${scene.meta}`);
            }

            if (this.setup) {
                this.setup.toDocument(document, sceneIndex, pathMap);
            }
        }

        return sceneIndex;
    }
}