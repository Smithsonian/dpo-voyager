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

export interface INodeComponents
{
    infos: boolean;
    scenes: boolean;
    models: boolean;
    cameras: boolean;
    lights: boolean;
}


export default class NVNode extends Node
{
    static readonly typeName: string = "NVNode";

    get transform() {
        return this.components.get(CVNode);
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
    get camera() {
        return this.components.get(CVCamera, true);
    }
    get light() {
        return this.components.get(CLight, true) as ICVLight;
    }

    createComponents()
    {
        this.name = "Node";
        this.createComponent(CVNode);
    }

    createScene()
    {
        this.name = "Scene";
        this.createComponent(CVInfo);
        this.createComponent(CVScene);
    }

    createModel()
    {
        this.name = "Model";
        this.createComponent(CVInfo);
        this.createComponent(CVModel2);
    }

    fromDocument(document: IDocument, nodeIndex: number)
    {
        const node = document.nodes[nodeIndex];
        this.transform.fromData(node);

        let name = "Node";

        if (isFinite(node.info)) {
            const info = this.getComponent(CVInfo, true) || this.createComponent(CVInfo);
            info.fromDocument(document, node);
            name = "Info";
        }
        if (isFinite(node.scene)) {
            // only one scene at the root of the graph allowed
            if (!this.hasGraphComponent(CVScene)) {
                this.createComponent(CVScene);
            }

            this.getComponent(CVScene).fromDocument(document, node);
            name = "Scene";
        }
        if (isFinite(node.model)) {
            this.createComponent(CVModel2).fromDocument(document, node);
            name = "Model";
        }
        if (isFinite(node.camera)) {
            this.createComponent(CVCamera).fromDocument(document, node);
            name = "Camera";
        }
        if (isFinite(node.light)) {
            const type = document.lights[node.light].type;
            switch (type) {
                case "directional":
                    this.createComponent(CVDirectionalLight).fromDocument(document, node);
                    name = "Directional Light";
                    break;
                case "point":
                    this.createComponent(CVPointLight).fromDocument(document, node);
                    name = "Point Light";
                    break;
                case "spot":
                    this.createComponent(CVSpotLight).fromDocument(document, node);
                    name = "Spot Light";
                    break;
                default:
                    throw new Error(`unknown light type: '${type}'`);
            }
        }

        this.name = node.name || name;

        const children = node.children;
        if (children) {
            children.forEach(childIndex => {
                const childNode = this.graph.createCustomNode(NVNode);
                this.transform.addChild(childNode.transform);
                childNode.fromDocument(document, childIndex);
            });
        }
    }

    toDocument(document: IDocument, components?: INodeComponents)
    {
        components = components || {
            infos: true,
            scenes: true,
            models: true,
            cameras: true,
            lights: true,
        };

        const index = document.nodes.length;
        const node = this.transform.toData();
        document.nodes.push(node);

        if (this.name) {
            node.name = this.name;
        }

        if (this.info && components.infos) {
            this.info.toDocument(document, node);
        }
        if (this.scene && components.scenes) {
            this.scene.toDocument(document, node);
        }
        if (this.model && components.models) {
            this.model.toDocument(document, node);
        }
        if (this.camera && components.cameras) {
            this.camera.toDocument(document, node);
        }
        if (this.light && components.lights) {
            this.light.toDocument(document, node);
        }

        const children = this.transform.children
            .map(child => child.node).filter(node => node.is(NVNode)) as NVNode[];

        children.forEach(child => {
            if (child.hasNodeComponents(components)) {
                const index = child.toDocument(document, components);
                node.children = node.children || [];
                node.children.push(index);
            }
        });

        return index;
    }

    hasNodeComponents(components: INodeComponents)
    {
        const tf = this.transform;
        const comps = this.components;

        if (components.infos && (comps.has(CVInfo) || tf.hasChildComponents(CVInfo, true))) {
            return true;
        }
        if (components.scenes && (comps.has(CVScene) || tf.hasChildComponents(CVScene, true))) {
            return true;
        }
        if (components.models && (comps.has(CVModel2) || tf.hasChildComponents(CVModel2, true))) {
            return true;
        }
        if (components.cameras && (comps.has(CVCamera) || tf.hasChildComponents(CVCamera, true))) {
            return true;
        }
        if (components.lights && (comps.has(CLight) || tf.hasChildComponents(CLight, true))) {
            return true;
        }

        return false;
    }
}