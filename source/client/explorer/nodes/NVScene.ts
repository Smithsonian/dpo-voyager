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

import { IDocument, INode, INodeExt, IScene, ISceneItem } from "common/types/document";

import CVNode from "../components/CVNode";
import CVMeta from "../components/CVMeta";
import CVArticles from "../components/CVArticles";

import NVNode from "./NVNode";
import NVItem from "./NVItem";
import NVExplorer from "./NVExplorer";

import NVGroup from "./NVGroup";
import NVModel from "./NVModel";
import NVCamera from "./NVCamera";
import NVLight from "./NVLight";
import NVDirectionalLight from "./NVDirectionalLight";
import NVPointLight from "./NVPointLight";
import NVSpotLight from "./NVSpotLight";

////////////////////////////////////////////////////////////////////////////////

export default class NVScene extends NVItem
{
    static readonly typeName: string = "NVScene";

    get meta() {
        return this.components.get(CVMeta);
    }
    get articles() {
        return this.components.get(CVArticles);
    }
    get explorer() {
        return this.getNode(NVExplorer);
    }

    createComponents()
    {
        super.createComponents();

        this.createComponent(CVMeta);
        this.createComponent(CVArticles);

        // Voyager Explorer features
        const explorerNode = this.graph.createCustomNode(NVExplorer);
        this.transform.addChild(explorerNode.transform);
    }

    fromDocument(documentData: IDocument, sceneIndex: number)
    {
        const sceneData = documentData.scenes[sceneIndex];

        if (sceneData.name) {
            this.name = sceneData.name;
        }

        const nodes = sceneData.nodes;
        nodes.forEach(nodeIndex => {
            const nodeData = documentData.nodes[nodeIndex];
            this.nodeFromData(this.transform, nodeData, documentData);
        });

        const itemData: ISceneItem = sceneData.extensions ? sceneData.extensions["SI_document"] : null;
        if (itemData) {
            // base class serializes units
            super.fromData(itemData);

            if (itemData.meta) {
                this.meta.fromData(itemData.meta);
            }
            if (itemData.articles) {
                this.articles.fromData(itemData.articles);
            }

            const explorer = itemData ? itemData.explorer : null;

            if (explorer) {
                this.getNode(NVExplorer).fromData(explorer);
            }
        }
    }

    toDocument(data: IDocument)
    {
        // base class serializes units
        const item: ISceneItem = super.toData();
        item.explorer = this.getNode(NVExplorer).toData();

        const scene: IScene = {
            nodes: [],
            extensions: {
                "SI_document": item
            }
        };

        if (this.name) {
            scene.name = this.name;
        }

        //data.nodes.push(node);
        data.scenes.push(scene);
    }

    protected nodeFromData(parent: CVNode, nodeData: INode, documentData: IDocument)
    {
        let node = null;

        const extDocData = documentData.extensions ? documentData.extensions["SI_document"] : null;
        const extNodeData = nodeData.extensions ? nodeData.extensions["SI_document"] : null;

        if (isFinite(extNodeData && extNodeData.group)) {
            const groupData = extDocData.groups[extNodeData.group];
            node = this.graph.createCustomNode(NVGroup);
            node.fromData(groupData);
        }
        else if (isFinite(extNodeData && extNodeData.model)) {
            const modelData = extDocData.models[extNodeData.model];
            node = this.graph.createCustomNode(NVModel);
            node.item.fromData(modelData);
        }
        else if (isFinite(nodeData.camera)) {
            const cameraData = documentData.cameras[nodeData.camera];
            node = this.graph.createCustomNode(NVCamera);
            node.fromCameraData(cameraData);
        }
        else if (isFinite(nodeData.light)) {
            const lightData = documentData.lights[nodeData.light];
            switch(lightData.type) {
                case "directional":
                    node = this.graph.createCustomNode(NVDirectionalLight);
                    break;
                case "point":
                    node = this.graph.createCustomNode(NVPointLight);
                    break;
                case "spot":
                    node = this.graph.createCustomNode(NVSpotLight);
                    break;
            }
            node.fromLightData(lightData);
        }
        else {
            node = this.graph.createCustomNode(NVNode);
        }

        node.transform.fromData(nodeData);
        parent.addChild(node.transform);

        if (nodeData.name) {
            node.name = nodeData.name;
        }

        if (nodeData.children) {
            nodeData.children.forEach(childIndex => {
                const childData = documentData.nodes[childIndex];
                this.nodeFromData(node.transform, childData, documentData);
            })
        }
    }

    protected nodeToData(node: NVNode, documentData: Partial<IDocument>, refIndex: number): number
    {
        const nodeData = node.transform.toData();

        if (node.name) {
            nodeData.name = node.name;
        }

        const index = documentData.nodes.length;
        documentData.nodes.push(nodeData);

        const isGroup = node instanceof NVGroup;
        const isModel = node instanceof NVModel;

        if (isGroup || isModel) {
            const docExt = documentData.extensions = documentData.extensions || {};
            const docExtData = docExt["SI_document"] = docExt["SI_document"] || {};
            const nodeExtData: INodeExt = {};
            nodeData.extensions = { "SI_document": nodeExtData };

            if (isGroup) {
                docExtData.groups  = docExtData.groups || [];
                nodeExtData.group = docExtData.groups.length;
                docExtData.groups.push((node as NVGroup).toData());
            }
            else if (isModel) {
                docExtData.models = docExtData.models || [];
                nodeExtData.model = docExtData.models.length;
                docExtData.models.push((node as NVModel).toData());
            }
        }
        else if (node instanceof NVCamera) {
            documentData.cameras = documentData.cameras || [];
            nodeData.camera = documentData.cameras.length;
            documentData.cameras.push(node.toCameraData());
        }
        else if (node instanceof NVLight) {
            documentData.lights = documentData.lights || [];
            nodeData.light = documentData.lights.length;
            documentData.lights.push(node.toLightData());
        }

        // deflate children
        const transforms = node.transform.children;
        if (transforms.length > 0) {
            nodeData.children = [];
            transforms.forEach(transform => {
                const node = transform.node;
                if (node instanceof NVNode) {
                    const index = this.nodeToData(node, documentData, refIndex);
                    nodeData.children.push(index);
                }
            });
        }

        return index;
    }
}