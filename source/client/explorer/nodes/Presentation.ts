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
import Node from "@ff/graph/Node";

import { IVoyager, IPresentation, INode } from "common/types";

import Transform from "@ff/scene/components/Transform";
import Meta from "../components/Meta";
import Snapshots from "../components/Snapshots";
import Tours from "../components/Tours";
import Documents from "../components/Documents";

import PresentationNode from "./PresentationNode";

import Group from "../nodes/Group";
import Item from "../nodes/Item";
import Reference from "../nodes/Reference";
import Camera from "../nodes/Camera";
import Light from "../nodes/Light";
import DirectionalLight from "../nodes/DirectionalLight";
import PointLight from "../nodes/PointLight";
import SpotLight from "../nodes/SpotLight";
import ExplorerSystem from "../ExplorerSystem";


// import Renderer from "../components/Renderer";
// import Reader from "../components/Reader";
//
// import Item from "./Item";

////////////////////////////////////////////////////////////////////////////////

export type ReferenceCallback = (index: number, graph: Graph, assetPath: string) => Node;


export default class Presentation extends Node
{
    static readonly type: string = "Presentation";

    readonly system: ExplorerSystem;

    protected url: string = "";
    protected assetPath: string = "";

    private _transform: Transform = null;

    get transform() {
        return this._transform;
    }

    createComponents()
    {
        this._transform = this.createComponent(Transform);
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
        const voyager: IVoyager = presentationData.voyager || {};

        // if (voyager.renderer) {
        //     this.renderer.fromData(voyager.renderer);
        // }
        //
        // if (voyager.reader) {
        //     this.reader.fromData(voyager.reader);
        // }

        return this;
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
            //renderer: this.renderer.toData(),
            //reader: this.reader.toData()
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
                        node = graph.createNode(Reference);
                        node.createComponents();
                        node.fromReferenceData(referenceData);
                    }

                    node.fromNodeData(nodeData);
                }
                else {
                    // node is reference, try to load external reference
                    const itemUrl = resolvePathname(referenceData.uri, this.url);
                    const loadingManager = this.system.loadingManager;

                    loadingManager.loadJSON(itemUrl).then(json =>
                        loadingManager.validateItem(json).then(itemData => {
                            node = graph.createNode(Item);
                            node.createComponents();
                            node.setUrl(itemUrl);
                            node.fromNodeData(nodeData);
                            node.fromItemData(itemData);
                        })
                    ).catch(error => {
                        console.log(`failed to create item from reference uri: ${error}`);
                        node = graph.createNode(Reference);
                        node.createComponents();
                        node.fromNodeData(nodeData);
                        node.fromReferenceData(referenceData);
                    });
                }
            }
        }
        else if (nodeData.item !== undefined) {
            const itemData = presentationData.items[nodeData.item];
            node = graph.createNode(Item);
            node.createComponents();
            node.setUrl(`item-${nodeData.item}.json`, this.assetPath);
            node.fromNodeData(nodeData);
            node.fromItemData(itemData);
        }
        else if (nodeData.camera !== undefined) {
            const cameraData = presentationData.cameras[nodeData.camera];
            node = graph.createNode(Camera);
            node.createComponents();
            node.fromNodeData(nodeData);
            node.fromCameraData(cameraData);
        }
        else if (nodeData.light !== undefined) {
            const lightData = presentationData.lights[nodeData.light];
            switch(lightData.type) {
                case "directional":
                    node = graph.createNode(DirectionalLight);
                    break;
                case "point":
                    node = graph.createNode(PointLight);
                    break;
                case "spot":
                    node = graph.createNode(SpotLight);
                    break;
            }

            node.createComponents();
            node.fromNodeData(nodeData);
            node.fromLightData(lightData);
        }
        else {
            node = graph.createNode(Group);
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

        // if (nodeData.reference !== undefined) {
        //     // node is a reference, if uri is a  number, insert corresponding item from supplied items array
        //     const reference = presentationData.references[nodeData.reference];
        //     if (reference.mimeType === "application/si-dpo-3d.item+json") {
        //         const index = Number(reference.uri);
        //         if (items && index >= 0 &&  index < items.length) {
        //             const item = node = items[index];
        //             name = item.name;
        //             this.items.push(item);
        //             referenceParsed = true;
        //         }
        //     }
        // }
        // else if (nodeData.item !== undefined) {
        //     // node is an item, create an item node from data
        //     const itemData = presentationData.items[nodeData.item];
        //     const item = parent.graph.createNode(Item);
        //     item.setLoadingManager(this.loadingManager);
        //     item.setAssetPath(this.assetPath);
        //     item.fromData(itemData);
        //     name = item.name;
        //     this.items.push(item);
        // }
        //
        // if (!node) {
        //     node = parent.graph.createNode(Node);
        //     node.createComponent(PTransform);
        // }
        //
        // const transform = node.components.get(PTransform);
        // transform.fromData(nodeData);
        // parent.addChild(transform);
        //
        // if (nodeData.reference !== undefined && !referenceParsed) {
        //     const reference = presentationData.references[nodeData.reference];
        //     // node is a reference, if uri is an index (we already know we don't have an item for the index)
        //     // keep node as reference, an item may be provided later
        //     if (reference.mimeType === "application/si-dpo-3d.item+json") {
        //         const index = Number(reference.uri);
        //         if (index >= 0) {
        //             name = "Reference";
        //             const reference = presentationData.references[nodeData.reference];
        //             node.createComponent(Reference).fromData(reference);
        //         }
        //         // now try to load the item from external reference
        //         else {
        //             name = "Item";
        //             const itemUrl = resolvePathname(reference.uri, this.assetPath);
        //
        //             this.loadingManager.loadJSON(itemUrl).then(json =>
        //                 this.loadingManager.validateItem(json).then(itemData => {
        //                     const item = node.createComponent(Item);
        //                     item.url = itemUrl;
        //                     item.setLoadingManager(this.loadingManager);
        //                     item.fromData(itemData);
        //                     this.items.push(item);
        //                 })
        //             ).catch(error => {
        //                 console.log(`failed to create item from reference uri: ${error}`);
        //                 node.name = "Reference";
        //                 const reference = presentationData.references[nodeData.reference];
        //                 node.createComponent(Reference).fromData(reference);
        //             })
        //         }
        //     }
        //     else {
        //         name = "Reference";
        //         const reference = presentationData.references[nodeData.reference];
        //         node.createComponent(Reference).fromData(reference);
        //     }
        // }
        // else if (nodeData.camera !== undefined) {
        //     name = "Camera";
        //     const cameraData = presentationData.cameras[nodeData.camera];
        //     node.createComponent(PCamera).fromData(cameraData);
        // }
        // else if (nodeData.light !== undefined) {
        //     name = "Light";
        //     const lightData = presentationData.lights[nodeData.light];
        //     switch(lightData.type) {
        //         case "directional":
        //             node.createComponent(PDirectionalLight).fromData(lightData);
        //             break;
        //         case "point":
        //             node.createComponent(PPointLight).fromData(lightData);
        //             break;
        //         case "spot":
        //             node.createComponent(PSpotLight).fromData(lightData);
        //             break;
        //     }
        // }
        //
        // node.name = nodeData.name || name || "Node";
        //
        // if (nodeData.children) {
        //     nodeData.children.forEach(childIndex => {
        //         const child = presentationData.nodes[childIndex];
        //         this.inflateNode(transform, child, presentationData, items);
        //     })
        // }
    }

    protected deflateNode(node: PresentationNode, pres: Partial<IPresentation>): Index
    {
        let nodeData;

        nodeData = node.toNodeData();
        pres.nodes.push(nodeData);
        const index = pres.nodes.length - 1;

        if (node instanceof Item) {
            pres.items = pres.items || [];
            pres.items.push(node.toItemData());
            nodeData.item = pres.items.length - 1;
        }
        else if (node instanceof Reference) {
            pres.references = pres.references || [];
            pres.references.push(node.toReferenceData());
            nodeData.reference = pres.references.length - 1;
        }
        else if (node instanceof Camera) {
            pres.cameras = pres.cameras || [];
            pres.cameras.push(node.toCameraData());
            nodeData.camera = pres.cameras.length -1;
        }
        else if (node instanceof Light) {
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
