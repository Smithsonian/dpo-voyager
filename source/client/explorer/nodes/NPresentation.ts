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

import { Index } from "@ff/core/types";
import Graph from "@ff/graph/Graph";
import RenderNode from "@ff/scene/RenderNode";

import { IPresentation, INode } from "common/types/presentation";

import CTransform from "@ff/scene/components/CTransform";
import CMeta from "../components/CMeta";
import CSnapshots from "../components/CSnapshots";
import CTours from "../components/CTours";
import CDocuments from "../components/CDocuments";

import CLoadingManager from "../../core/components/CLoadingManager";
import CVoyagerScene from "../../core/components/CVoyagerScene";
import COrbitNavigation from "../../core/components/COrbitNavigation";

import CHomeGrid from "../components/CHomeGrid";
import CBackground from "../components/CBackground";
import CGroundPlane from "../components/CGroundPlane";
import CInterface from "../components/CInterface";
import CReader from "../components/CReader";
import CTapeTool from "../components/CTapeTool";
import CSectionTool from "../components/CSectionTool";

import NPresentationNode from "./NPresentationNode";
import NGroupNode from "../nodes/NGroupNode";
import NItemNode from "../nodes/NItemNode";
import NReferenceNode from "../nodes/NReferenceNode";
import NCameraNode from "../nodes/NCameraNode";
import NLightNode from "../nodes/NLightNode";
import NDirectionalLightNode from "../nodes/NDirectionalLightNode";
import NPointLightNode from "../nodes/NPointLightNode";
import NSpotLightNode from "../nodes/NSpotLightNode";

////////////////////////////////////////////////////////////////////////////////

export type ReferenceCallback = (index: number, graph: Graph, assetPath: string) => NPresentationNode;


export default class NPresentation extends RenderNode
{
    static readonly type: string = "NPresentation";

    protected url: string = "";
    protected assetPath: string = "";
    protected loadingManager: CLoadingManager = null;

    activate()
    {
        this.components.get(CVoyagerScene).ins.activate.set();
    }

    deactivate()
    {

    }

    createComponents()
    {
        this.loadingManager = this.system.components.safeGet(CLoadingManager);

        this.createComponent(CVoyagerScene);
        this.createComponent(CHomeGrid);
        this.createComponent(CBackground);
        this.createComponent(CGroundPlane);
        this.createComponent(COrbitNavigation);
        this.createComponent(CInterface);
        this.createComponent(CReader);
        this.createComponent(CTapeTool);
        this.createComponent(CSectionTool);
        this.createComponent(CMeta);
        this.createComponent(CSnapshots);
        this.createComponent(CTours);
        this.createComponent(CDocuments);

        this.name = "Presentation";
    }

    setUrl(url: string, assetPath?: string)
    {
        this.url = url;
        const urlPath = resolvePathname(".", url);
        this.assetPath = assetPath ? assetPath : urlPath;
        const urlName = url.substr(urlPath.length);

        if (urlName) {
            this.name = urlName;
        }
    }

    fromData(presentationData: IPresentation, url: string, assetPath?: string, callback?: ReferenceCallback)
    {
        // scene, nodes
        const nodes = presentationData.scene.nodes;
        nodes.forEach(nodeIndex => {
            const nodeData = presentationData.nodes[nodeIndex];
            this.inflateNode(this, nodeData, presentationData, callback);
        });

        // Voyager settings
        const voyager = presentationData.voyager;

        if (voyager) {
            if (voyager.scene) {
                this.components.get(CVoyagerScene).fromData(voyager.scene);
            }
            if (voyager.grid) {
                this.components.get(CHomeGrid).fromData(voyager.grid);
            }
            if (voyager.background) {
                this.components.get(CBackground).fromData(voyager.background);
            }
            if (voyager.groundPlane) {
                this.components.get(CGroundPlane).fromData(voyager.groundPlane);
            }
            if (voyager.navigation && voyager.navigation.type === "Orbit") {
                this.components.get(COrbitNavigation).fromData(voyager.navigation);
            }
            if (voyager.interface) {
                this.components.get(CInterface).fromData(voyager.interface);
            }
            if (voyager.reader) {
                this.components.get(CReader).fromData(voyager.reader);
            }
            if (voyager.tapeTool) {
                this.components.get(CTapeTool).fromData(voyager.tapeTool);
            }
            if (voyager.sectionTool) {
                this.components.get(CSectionTool).fromData(voyager.sectionTool);
            }
        }
    }

    toData()
    {
        const presentationData: Partial<IPresentation> = {};

        presentationData.asset = {
            copyright: "Copyright Smithsonian Institution",
            generator: "Voyager Presentation Parser",
            version: "1.1"
        };

        presentationData.scene = {
            nodes: []
        };

        // scene, nodes
        const transforms = this.transform.children;

        if (transforms.length > 0) {
            presentationData.nodes = [];
            transforms.forEach(transform => {
                const node = transform.node;
                if (node instanceof NPresentationNode) {
                    const index = this.deflateNode(node, presentationData);
                    presentationData.scene.nodes.push(index);
                }
            });
        }

        // explorer settings
        presentationData.voyager = {
            scene: this.components.get(CVoyagerScene).toData(),
            grid: this.components.get(CHomeGrid).toData(),
            background: this.components.get(CBackground).toData(),
            groundPlane: this.components.get(CGroundPlane).toData(),
            navigation: this.components.get(COrbitNavigation).toData(),
            interface: this.components.get(CInterface).toData(),
            reader: this.components.get(CReader).toData(),
            tapeTool: this.components.get(CTapeTool).toData(),
            sectionTool: this.components.get(CSectionTool).toData()
        };

        return presentationData as IPresentation;
    }

    protected inflateNode(parent: NPresentation | NPresentationNode, nodeData: INode,
                          presentationData: IPresentation, callback?: ReferenceCallback)
    {
        const graph = parent.graph;
        let node;

        if (nodeData.reference !== undefined) {
            const referenceData = presentationData.references[nodeData.reference];
            if (referenceData.mimeType === "application/si-dpo-3d.item+json") {
                const index = Number(referenceData.uri);
                if (index >= 0) {
                    node = callback && callback(index, graph, this.assetPath);

                    if (!node) {
                        node = graph.createNode(NReferenceNode);
                        node.createComponents();
                        node.fromReferenceData(referenceData);
                    }

                    node.fromNodeData(nodeData);
                }
                else {
                    // node is reference, try to load external reference
                    const itemUrl = resolvePathname(referenceData.uri, this.url);
                    const loadingManager = this.loadingManager;

                    loadingManager.loadJSON(itemUrl).then(json =>
                        loadingManager.validateItem(json).then(itemData => {
                            node = graph.createNode(NItemNode);
                            node.createComponents();
                            node.setUrl(itemUrl);
                            node.fromNodeData(nodeData);
                            node.fromItemData(itemData);
                        })
                    ).catch(error => {
                        console.log(`failed to create item from reference uri: ${error}`);
                        node = graph.createNode(NReferenceNode);
                        node.createComponents();
                        node.fromNodeData(nodeData);
                        node.fromReferenceData(referenceData);
                    });
                }
            }
        }
        else if (nodeData.item !== undefined) {
            const itemData = presentationData.items[nodeData.item];
            node = graph.createNode(NItemNode);
            node.createComponents();
            node.setUrl(`item-${nodeData.item}.json`, this.assetPath);
            node.fromNodeData(nodeData);
            node.fromItemData(itemData);
        }
        else if (nodeData.camera !== undefined) {
            const cameraData = presentationData.cameras[nodeData.camera];
            node = graph.createNode(NCameraNode);
            node.createComponents();
            node.fromNodeData(nodeData);
            node.fromCameraData(cameraData);
        }
        else if (nodeData.light !== undefined) {
            const lightData = presentationData.lights[nodeData.light];
            switch(lightData.type) {
                case "directional":
                    node = graph.createNode(NDirectionalLightNode);
                    break;
                case "point":
                    node = graph.createNode(NPointLightNode);
                    break;
                case "spot":
                    node = graph.createNode(NSpotLightNode);
                    break;
            }

            node.createComponents();
            node.fromNodeData(nodeData);
            node.fromLightData(lightData);
        }
        else {
            node = graph.createNode(NGroupNode);
            node.createComponents();
            node.fromNodeData(nodeData);
        }

        parent.transform.addChild(node.transform);

        if (nodeData.children) {
            nodeData.children.forEach(childIndex => {
                const child = presentationData.nodes[childIndex];
                this.inflateNode(node, child, presentationData, callback);
            })
        }
    }

    protected deflateNode(node: NPresentationNode, pres: Partial<IPresentation>): Index
    {
        let nodeData;

        nodeData = node.toNodeData();
        pres.nodes.push(nodeData);
        const index = pres.nodes.length - 1;

        if (node instanceof NItemNode) {
            pres.items = pres.items || [];
            pres.items.push(node.toItemData());
            nodeData.item = pres.items.length - 1;
        }
        else if (node instanceof NReferenceNode) {
            pres.references = pres.references || [];
            pres.references.push(node.toReferenceData());
            nodeData.reference = pres.references.length - 1;
        }
        else if (node instanceof NCameraNode) {
            pres.cameras = pres.cameras || [];
            pres.cameras.push(node.toCameraData());
            nodeData.camera = pres.cameras.length -1;
        }
        else if (node instanceof NLightNode) {
            pres.lights = pres.lights || [];
            pres.lights.push(node.toLightData());
            nodeData.light = pres.lights.length - 1;
        }

        // deflate children
        const transforms = this.components.get(CTransform).children;
        if (transforms.length > 0) {
            nodeData.children = [];
            transforms.forEach(transform => {
                const node = transform.node;
                if (node instanceof NPresentationNode) {
                    const index = this.deflateNode(node, pres);
                    nodeData.children.push(index);
                }
            });
        }

        return index;
    }
}
