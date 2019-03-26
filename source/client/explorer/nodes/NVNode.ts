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

import { IDocument } from "common/types/document";

import CVNode from "../components/CVNode";

import CVCamera from "../components/CVCamera";
import { ICVLight, CLight } from "../components/CVLight";
import CVDirectionalLight from "../components/CVDirectionalLight";
import CVPointLight from "../components/CVPointLight";
import CVSpotLight from "../components/CVSpotLight";

import CVInfo from "../components/CVInfo";
import CVScene from "../components/CVScene";
import CVModel2 from "../components/CVModel2";

////////////////////////////////////////////////////////////////////////////////

export default class NVNode extends Node
{
    static readonly typeName: string = "NVNode";

    get transform() {
        return this.components.get(CVNode);
    }
    get camera() {
        return this.components.get(CVCamera, true);
    }
    get light() {
        return this.components.get(CLight, true) as ICVLight;
    }
    get info() {
        return this.components.get(CVInfo, true);
    }
    get scene() {
        return this.components.get(CVScene, true);
    }
    get model() {
        return this.components.get(CVModel2, true);
    }

    createComponents()
    {
        this.createComponent(CVNode, "Node", this.id);
    }

    createCamera()
    {
        this.createComponent(CVCamera);
    }

    createScene()
    {
        return this.createComponent(CVScene);
    }

    createModel()
    {
        return this.createComponent(CVModel2);
    }

    createEntity()
    {
        return this.createComponent(CVInfo);
    }

    fromDocument(document: IDocument, nodeIndex: number)
    {
        const node = document.nodes[nodeIndex];
        this.transform.fromData(node);

        if (node.name) {
            this.name = node.name;
        }

        if (isFinite(node.camera)) {
            this.createComponent(CVCamera).fromDocument(document, node);
        }
        if (isFinite(node.light)) {
            const type = document.lights[node.light].type;
            switch (type) {
                case "directional":
                    this.createComponent(CVDirectionalLight).fromDocument(document, node);
                    break;
                case "spot":
                    this.createComponent(CVSpotLight).fromDocument(document, node);
                    break;
                case "point":
                    this.createComponent(CVPointLight).fromDocument(document, node);
                    break;
                default:
                    throw new Error(`unknown light type: '${type}'`);
            }
        }
        if (isFinite(node.info)) {
            this.createComponent(CVInfo).fromDocument(document, node);
        }
        if (isFinite(node.scene)) {
            this.createComponent(CVScene).fromDocument(document, node);
        }
        if (isFinite(node.model)) {
            this.createComponent(CVModel2).fromDocument(document, node);
        }

        const children = node.children;
        if (children) {
            children.forEach(childIndex => {
                const childNode = this.graph.createCustomNode(NVNode);
                this.transform.addChild(childNode.transform);
                childNode.fromDocument(document, childIndex);
            });
        }
    }

    toDocument(document: IDocument)
    {
        const index = document.nodes.length;
        const node = this.transform.toData();
        document.nodes.push(node);

        if (this.name) {
            node.name = this.name;
        }

        if (this.camera) {
            this.camera.toDocument(document, node);
        }
        if (this.light) {
            this.light.toDocument(document, node);
        }
        if (this.info) {
            this.info.toDocument(document, node);
        }
        if (this.scene) {
            this.scene.toDocument(document, node);
        }
        if (this.model) {
            this.model.toDocument(document, node);
        }

        const children = this.transform.children;
        children.forEach(child => {
            if (child.node instanceof NVNode) {
                const index = child.node.toDocument(document);
                node.children = node.children || [];
                node.children.push(index);
            }
        });

        return index;
    }
}