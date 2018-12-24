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
import Node from "@ff/graph/Node";

import {
    IPresentation,
    INode as INodeData,
    IVoyager
} from "common/types";

import LoadingManager from "../loaders/LoadingManager";

import PTransform from "../components/PTransform";
import PCamera from "../components/PCamera";
import PLight from "../components/PLight";
import PDirectionalLight from "../components/PDirectionalLight";
import PPointLight from "../components/PPointLight";
import PSpotLight from "../components/PSpotLight";

import Reference from "../components/Reference";
import Meta from "../components/Meta";
import Documents from "../components/Documents";
import Snapshots from "../components/Snapshots";
import Tours from "../components/Tours";
import Renderer from "../components/Renderer";
import Reader from "../components/Reader";

import Item from "./Item";

////////////////////////////////////////////////////////////////////////////////

export default class Presentation extends Node
{
    static readonly type: string = "Presentation";

    protected path: string = "";
    protected loadingManager: LoadingManager = null;
    protected items: Item[] = [];

    get transform() {
        return this.components.get(PTransform);
    }
    get camera() {
        return this.hierarchy.getChild(PCamera, true);
    }
    get renderer() {
        return this.hierarchy.getParent(Renderer, false);
    }
    get reader() {
        return this.hierarchy.getParent(Reader, false);
    }

    create()
    {
        this.name = "Presentation";

        this.createComponent(PTransform);
        this.createComponent(Meta);
        this.createComponent(Snapshots);
        this.createComponent(Tours);
        this.createComponent(Documents);
    }

    setLoadingManager(loadingManager: LoadingManager, url?: string)
    {
        this.loadingManager = loadingManager;
        this.path = resolvePathname(".", url || location.href);
    }

    fromData(data: IPresentation, items?: Item[])
    {
        // scene, nodes
        const nodes = data.scene.nodes;
        nodes.forEach(nodeIndex => {
            const node = data.nodes[nodeIndex];
            this.inflateNode(this.transform, node, data, items);
        });

        // Voyager settings
        const voyager: IVoyager = data.voyager || {};

        if (voyager.renderer) {
            this.renderer.fromData(voyager.renderer);
        }

        if (voyager.reader) {
            this.reader.fromData(voyager.reader);
        }

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
                if (transform instanceof PTransform) {
                    const index = this.deflateNode(transform, presentationData);
                    presentationData.scene.nodes.push(index);
                }
            });
        }

        // explorer settings
        presentationData.voyager = {
            renderer: this.renderer.toData(),
            reader: this.reader.toData()
        };

        return presentationData as IPresentation;
    }

    protected inflateNode(parent: PTransform, nodeData: INodeData, presentationData: IPresentation, items?: Item[])
    {
        let node;
        let referenceParsed = false;
        let name;

        if (nodeData.reference !== undefined) {
            // node is a reference, if uri is a  number, insert corresponding item from supplied items array
            const reference = presentationData.references[nodeData.reference];
            if (reference.mimeType === "application/si-dpo-3d.item+json") {
                const index = Number(reference.uri);
                if (items && index >= 0 &&  index < items.length) {
                    const item = node = items[index];
                    name = item.name;
                    this.items.push(item);
                    referenceParsed = true;
                }
            }
        }
        else if (nodeData.item !== undefined) {
            // node is an item, create an item node from data
            const itemData = presentationData.items[nodeData.item];
            const item = parent.graph.createNode(Item);
            item.setLoadingManager(this.loadingManager);
            item.fromData(itemData, this.path);
            name = item.name;
            this.items.push(item);
        }

        if (!node) {
            node = parent.graph.createNode(Node);
            node.createComponent(PTransform);
        }

        const transform = node.components.get(PTransform);
        transform.fromData(nodeData);
        parent.addChild(transform);

        if (nodeData.reference !== undefined && !referenceParsed) {
            const reference = presentationData.references[nodeData.reference];
            // node is a reference, if uri is an index (we already know we don't have an item for the index)
            // keep node as reference, an item may be provided later
            if (reference.mimeType === "application/si-dpo-3d.item+json") {
                const index = Number(reference.uri);
                if (index >= 0) {
                    name = "Reference";
                    const reference = presentationData.references[nodeData.reference];
                    node.createComponent(Reference).fromData(reference);
                }
                // now try to load the item from external reference
                else {
                    name = "Item";
                    const itemUrl = resolvePathname(reference.uri, this.path);

                    this.loadingManager.loadJSON(itemUrl).then(json =>
                        this.loadingManager.validateItem(json).then(itemData => {
                            const item = node.createComponent(Item);
                            item.url = itemUrl;
                            item.setLoadingManager(this.loadingManager);
                            item.fromData(itemData);
                            this.items.push(item);
                        })
                    ).catch(error => {
                        console.log(`failed to create item from reference uri: ${error}`);
                        node.name = "Reference";
                        const reference = presentationData.references[nodeData.reference];
                        node.createComponent(Reference).fromData(reference);
                    })
                }
            }
            else {
                name = "Reference";
                const reference = presentationData.references[nodeData.reference];
                node.createComponent(Reference).fromData(reference);
            }
        }
        else if (nodeData.camera !== undefined) {
            name = "Camera";
            const cameraData = presentationData.cameras[nodeData.camera];
            node.createComponent(PCamera).fromData(cameraData);
        }
        else if (nodeData.light !== undefined) {
            name = "Light";
            const lightData = presentationData.lights[nodeData.light];
            switch(lightData.type) {
                case "directional":
                    node.createComponent(PDirectionalLight).fromData(lightData);
                    break;
                case "point":
                    node.createComponent(PPointLight).fromData(lightData);
                    break;
                case "spot":
                    node.createComponent(PSpotLight).fromData(lightData);
                    break;
            }
        }

        node.name = nodeData.name || name || "Node";

        if (nodeData.children) {
            nodeData.children.forEach(childIndex => {
                const child = presentationData.nodes[childIndex];
                this.inflateNode(transform, child, presentationData, items);
            })
        }
    }

    protected deflateNode(transform: PTransform, pres: Partial<IPresentation>): Index
    {
        const nodeData: INodeData = transform.toData() as Partial<INodeData>;
        const node = transform.node;
        if (node.name) {
            nodeData.name = node.name;
        }

        pres.nodes.push(nodeData);
        const index = pres.nodes.length - 1;

        const camera = transform.components.get(PCamera);
        const light = transform.components.get(PLight);
        const reference = transform.components.get(Reference);

        if (node instanceof Item) {
            pres.items = pres.items || [];
            pres.items.push(node.toData());
            nodeData.item = pres.items.length - 1;
        }
        else if (camera) {
            pres.cameras = pres.cameras || [];
            pres.cameras.push(camera.toData());
            nodeData.camera = pres.cameras.length -1;
        }
        else if (light) {
            pres.lights = pres.lights || [];
            pres.lights.push(light.toData());
            nodeData.light = pres.lights.length - 1;
        }
        else if (reference) {
            pres.references = pres.references || [];
            pres.references.push(reference.toData());
            nodeData.reference = pres.references.length - 1;
        }

        // deflate children
        const transforms = transform.children;
        if (transforms.length > 0) {
            nodeData.children = [];
            transforms.forEach(transform => {
                if (transform instanceof PTransform) {
                    const index = this.deflateNode(transform, pres);
                    nodeData.children.push(index);
                }
            })
        }

        return index;
    }
}
