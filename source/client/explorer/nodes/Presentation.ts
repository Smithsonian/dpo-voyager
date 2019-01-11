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
import Camera from "@ff/scene/components/Camera";
import RenderNode from "@ff/scene/RenderNode";

import { IPresentation, INode } from "common/types/presentation";

import Transform from "@ff/scene/components/Transform";
import Meta from "../components/Meta";
import Snapshots from "../components/Snapshots";
import Tours from "../components/Tours";
import Documents from "../components/Documents";

import CLoadingManager from "../../core/components/CLoadingManager";
import VoyagerScene from "../../core/components/VoyagerScene";
import OrbitNavigation from "../../core/components/OrbitNavigation";

import HomeGrid from "../components/HomeGrid";
import Background from "../components/Background";
import GroundPlane from "../components/GroundPlane";
import Interface from "../components/Interface";
import Reader from "../components/Reader";
import TapeTool from "../components/TapeTool";
import SectionTool from "../components/SectionTool";

import PresentationNode from "./PresentationNode";
import GroupNode from "../nodes/GroupNode";
import ItemNode from "../nodes/ItemNode";
import ReferenceNode from "../nodes/ReferenceNode";
import CameraNode from "../nodes/CameraNode";
import LightNode from "../nodes/LightNode";
import DirectionalLightNode from "../nodes/DirectionalLightNode";
import PointLightNode from "../nodes/PointLightNode";
import SpotLightNode from "../nodes/SpotLightNode";

////////////////////////////////////////////////////////////////////////////////

export type ReferenceCallback = (index: number, graph: Graph, assetPath: string) => PresentationNode;


export default class Presentation extends RenderNode
{
    static readonly type: string = "Presentation";

    protected url: string = "";
    protected assetPath: string = "";
    protected loadingManager: CLoadingManager = null;

    activate()
    {
        this.components.get(VoyagerScene).ins.activate.set();
    }

    deactivate()
    {

    }

    createComponents()
    {
        this.loadingManager = this.system.components.safeGet(CLoadingManager);

        this.createComponent(VoyagerScene);
        this.createComponent(HomeGrid);
        this.createComponent(Background);
        this.createComponent(GroundPlane);
        this.createComponent(OrbitNavigation);
        this.createComponent(Interface);
        this.createComponent(Reader);
        this.createComponent(TapeTool);
        this.createComponent(SectionTool);
        this.createComponent(Meta);
        this.createComponent(Snapshots);
        this.createComponent(Tours);
        this.createComponent(Documents);

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
                this.components.get(VoyagerScene).fromData(voyager.scene);
            }
            if (voyager.grid) {
                this.components.get(HomeGrid).fromData(voyager.grid);
            }
            if (voyager.background) {
                this.components.get(Background).fromData(voyager.background);
            }
            if (voyager.groundPlane) {
                this.components.get(GroundPlane).fromData(voyager.groundPlane);
            }
            if (voyager.navigation && voyager.navigation.type === "Orbit") {
                this.components.get(OrbitNavigation).fromData(voyager.navigation);
            }
            if (voyager.interface) {
                this.components.get(Interface).fromData(voyager.interface);
            }
            if (voyager.reader) {
                this.components.get(Reader).fromData(voyager.reader);
            }
            if (voyager.tapeTool) {
                this.components.get(TapeTool).fromData(voyager.tapeTool);
            }
            if (voyager.sectionTool) {
                this.components.get(SectionTool).fromData(voyager.sectionTool);
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
                if (node instanceof PresentationNode) {
                    const index = this.deflateNode(node, presentationData);
                    presentationData.scene.nodes.push(index);
                }
            });
        }

        // explorer settings
        presentationData.voyager = {
            scene: this.components.get(VoyagerScene).toData(),
            grid: this.components.get(HomeGrid).toData(),
            background: this.components.get(Background).toData(),
            groundPlane: this.components.get(GroundPlane).toData(),
            navigation: this.components.get(OrbitNavigation).toData(),
            interface: this.components.get(Interface).toData(),
            reader: this.components.get(Reader).toData(),
            tapeTool: this.components.get(TapeTool).toData(),
            sectionTool: this.components.get(SectionTool).toData()
        };

        return presentationData as IPresentation;
    }

    protected inflateNode(parent: Presentation | PresentationNode, nodeData: INode,
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
                        node = graph.createNode(ReferenceNode);
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
                            node = graph.createNode(ItemNode);
                            node.createComponents();
                            node.setUrl(itemUrl);
                            node.fromNodeData(nodeData);
                            node.fromItemData(itemData);
                        })
                    ).catch(error => {
                        console.log(`failed to create item from reference uri: ${error}`);
                        node = graph.createNode(ReferenceNode);
                        node.createComponents();
                        node.fromNodeData(nodeData);
                        node.fromReferenceData(referenceData);
                    });
                }
            }
        }
        else if (nodeData.item !== undefined) {
            const itemData = presentationData.items[nodeData.item];
            node = graph.createNode(ItemNode);
            node.createComponents();
            node.setUrl(`item-${nodeData.item}.json`, this.assetPath);
            node.fromNodeData(nodeData);
            node.fromItemData(itemData);
        }
        else if (nodeData.camera !== undefined) {
            const cameraData = presentationData.cameras[nodeData.camera];
            node = graph.createNode(CameraNode);
            node.createComponents();
            node.fromNodeData(nodeData);
            node.fromCameraData(cameraData);
        }
        else if (nodeData.light !== undefined) {
            const lightData = presentationData.lights[nodeData.light];
            switch(lightData.type) {
                case "directional":
                    node = graph.createNode(DirectionalLightNode);
                    break;
                case "point":
                    node = graph.createNode(PointLightNode);
                    break;
                case "spot":
                    node = graph.createNode(SpotLightNode);
                    break;
            }

            node.createComponents();
            node.fromNodeData(nodeData);
            node.fromLightData(lightData);
        }
        else {
            node = graph.createNode(GroupNode);
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

    protected deflateNode(node: PresentationNode, pres: Partial<IPresentation>): Index
    {
        let nodeData;

        nodeData = node.toNodeData();
        pres.nodes.push(nodeData);
        const index = pres.nodes.length - 1;

        if (node instanceof ItemNode) {
            pres.items = pres.items || [];
            pres.items.push(node.toItemData());
            nodeData.item = pres.items.length - 1;
        }
        else if (node instanceof ReferenceNode) {
            pres.references = pres.references || [];
            pres.references.push(node.toReferenceData());
            nodeData.reference = pres.references.length - 1;
        }
        else if (node instanceof CameraNode) {
            pres.cameras = pres.cameras || [];
            pres.cameras.push(node.toCameraData());
            nodeData.camera = pres.cameras.length -1;
        }
        else if (node instanceof LightNode) {
            pres.lights = pres.lights || [];
            pres.lights.push(node.toLightData());
            nodeData.light = pres.lights.length - 1;
        }

        // deflate children
        const transforms = this.components.get(Transform).children;
        if (transforms.length > 0) {
            nodeData.children = [];
            transforms.forEach(transform => {
                const node = transform.node;
                if (node instanceof PresentationNode) {
                    const index = this.deflateNode(node, pres);
                    nodeData.children.push(index);
                }
            });
        }

        return index;
    }
}
