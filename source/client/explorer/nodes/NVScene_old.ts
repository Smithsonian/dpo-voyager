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

import resolvePathname from "resolve-pathname";

import CHierarchy from "@ff/graph/components/CHierarchy";

import {
    IPresentation,
    INode,
} from "common/types/presentation";

import CVAssetLoader from "../../core/components/CVAssetLoader";
import CVScene_old from "../../core/components/CVScene_old";

import NVNode from "./NVNode";
import NVCamera from "./NVCamera";
import NVLight from "./NVLight";
import NVDirectionalLight from "./NVDirectionalLight";
import NVPointLight from "./NVPointLight";
import NVSpotLight from "./NVSpotLight";
import NVReference from "./NVReference";
import NVItem_old from "./NVItem_old";
import CTransform from "@ff/scene/components/CTransform";

////////////////////////////////////////////////////////////////////////////////

export default class NVScene_old extends NVNode
{
    static readonly typeName: string = "NVScene_old";

    url: string;
    assetPath: string;

    get loadingManager() {
        return this.getMainComponent(CVAssetLoader);
    }
    get scene() {
        return this.getComponent(CVScene_old);
    }

    setUrl(url: string, assetPath?: string)
    {
        this.url = url;
        this.assetPath = assetPath || resolvePathname(".", url);
    }

    createComponents()
    {
        super.createComponents();
        this.createComponent(CVScene_old);
    }

    fromData(data: IPresentation)
    {
        const sceneData = data.features.scene;
        this.scene.fromData(sceneData);

        const nodes = data.scene.nodes;
        nodes.forEach(nodeIndex => {
            const nodeData = data.nodes[nodeIndex];
            this.nodeFromData(this.transform, nodeData, data);
        });
    }

    toData(writeReferences?: boolean): IPresentation
    {
        const refIndex = writeReferences ? 0 : undefined;

        const data: Partial<IPresentation> = {
            scene: { nodes: [] },
            features: { scene: this.scene.toData() },
        };

        const children = this.transform.children;

        if (children.length > 0) {
            data.nodes = [];

            children.forEach(child => {
                const node = child.node;
                if (node instanceof NVNode) {
                    const index = this.nodeToData(node, data, refIndex);
                    data.scene.nodes.push(index);
                }
            });
        }

        return data as IPresentation;
    }

    protected nodeFromData(parent: CHierarchy, nodeData: INode, presentationData: IPresentation)
    {
        let node = null;

        if (isFinite(nodeData.reference)) {
            const referenceData = presentationData.references[nodeData.reference];
            node = this.graph.createCustomNode(NVReference);
            node.fromData(referenceData);
        }
        else if (isFinite(nodeData.item)) {
            const itemData = presentationData.items[nodeData.item];
            node = this.graph.createCustomNode(NVItem_old);
            node.item.fromData(itemData);
        }
        else if (isFinite(nodeData.camera)) {
            const cameraData = presentationData.cameras[nodeData.camera];
            node = this.graph.createCustomNode(NVCamera);
            node.fromCameraData(cameraData);
        }
        else if (isFinite(nodeData.light)) {
            const lightData = presentationData.lights[nodeData.light];
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

        node.fromNodeData(nodeData);
        parent.addChild(node.getComponent(CTransform));

        if (nodeData.name) {
            node.name = nodeData.name;
        }

        if (nodeData.children) {
            nodeData.children.forEach(childIndex => {
                const childData = presentationData.nodes[childIndex];
                this.nodeFromData(node.transform, childData, presentationData);
            })
        }
    }

    protected nodeToData(node: NVNode, data: Partial<IPresentation>, refIndex: number): number
    {
        const nodeData = node.transform.toData();

        if (node.name) {
            nodeData.name = node.name;
        }

        const index = data.nodes.length;
        data.nodes.push(nodeData);

        if (node instanceof NVItem_old) {
            if (refIndex === undefined) {
                data.items = data.items || [];
                nodeData.item = data.items.length;
                data.items.push(node.toData());
            }
            else {
                data.references = data.references || [];
                nodeData.reference = data.references.length;
                const uri = (refIndex++).toString();
                data.references.push({ uri });
            }
        }
        else if (node instanceof NVReference) {
            data.references = data.references || [];
            nodeData.reference = data.references.length;
            data.references.push(node.toData());
        }
        else if (node instanceof NVCamera) {
            data.cameras = data.cameras || [];
            nodeData.camera = data.cameras.length;
            data.cameras.push(node.toCameraData());
        }
        else if (node instanceof NVLight) {
            data.lights = data.lights || [];
            nodeData.light = data.lights.length;
            data.lights.push(node.toLightData());
        }

        // deflate children
        const transforms = node.transform.children;
        if (transforms.length > 0) {
            nodeData.children = [];
            transforms.forEach(transform => {
                const node = transform.node;
                if (node instanceof NVNode) {
                    const index = this.nodeToData(node, data, refIndex);
                    nodeData.children.push(index);
                }
            });
        }

        return index;
    }
}