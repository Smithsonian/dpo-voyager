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

import { IDocument, IScene } from "common/types/document";

import NVNode, { INodeComponents } from "./NVNode";

import CVScene from "../components/CVScene";
import CVSetup from "../components/CVSetup";
import CVInfo from "../components/CVInfo";

////////////////////////////////////////////////////////////////////////////////

export default class NVScene extends NVNode
{
    static readonly typeName: string = "NVScene";

    get scene() {
        return this.components.get(CVScene);
    }
    get setup() {
        return this.components.get(CVSetup);
    }

    createComponents()
    {
        this.createComponent(CVScene);
        this.createComponent(CVSetup);
        this.createComponent(CVInfo);
    }

    fromDocument(document: IDocument, sceneIndex: number)
    {
        const scene = document.scenes[sceneIndex];

        if (scene.name) {
            this.name = scene.name;
        }

        if (isFinite(scene.setup)) {
            const featureData = document.setups[scene.setup];
            this.setup.fromData(featureData);
        }
        if (isFinite(scene.info)) {
            this.info.fromDocument(document, scene);
        }

        const nodeIndices = scene.nodes;
        if (nodeIndices) {
            nodeIndices.forEach(nodeIndex => {
                const childNode = this.graph.createCustomNode(NVNode);
                this.transform.addChild(childNode.transform);
                childNode.fromDocument(document, nodeIndex);
            });
        }
    }

    toDocument(document: IDocument, components?: INodeComponents): number
    {
        document.scenes = document.scenes || [];
        const index = document.scenes.length;
        const scene: IScene = {};

        if (!components || components.setup) {
            document.setups = document.setups || [];
            const setupIndex = document.setups.length;
            document.setups.push(this.setup.toData());
            scene.setup = setupIndex;
        }

        this.info.toDocument(document, scene);

        const children = this.transform.children
            .map(child => child.node).filter(node => node.is(NVNode)) as NVNode[];

        children.forEach(child => {
            if (child.hasNodeComponents(components)) {
                const index = child.toDocument(document, components);
                scene.nodes = scene.nodes || [];
                scene.nodes.push(index);
            }
        });

        return index;
    }
}