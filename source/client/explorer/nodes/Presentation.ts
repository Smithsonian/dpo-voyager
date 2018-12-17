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
import { Node } from "@ff/graph";

import Scene from "@ff/scene/components/Scene";
import Transform from "@ff/scene/components/Transform";
import Camera from "@ff/scene/components/Camera";
import Light from "@ff/scene/components/Light";
import DirectionalLight from "@ff/scene/components/DirectionalLight";
import PointLight from "@ff/scene/components/PointLight";
import SpotLight from "@ff/scene/components/SpotLight";

import {
    IPresentation,
    INode as INodeData,
    IVoyager
} from "common/types";

import Loaders from "../loaders/Loaders";
import nodeParser from "../loaders/nodeParser";

import Reference from "../components/Reference";
import Documents from "../components/Documents";
import Groups from "../components/Groups";
import Snapshots from "../components/Snapshots";
import Tours from "../components/Tours";
import Renderer from "../components/Renderer";
import Reader from "../components/Reader";

import Item from "./Item";

////////////////////////////////////////////////////////////////////////////////

export default class Presentation extends Node
{
    protected path: string;
    protected loaders: Loaders;
    protected items: Item[];

    protected get scene() {
        return this.components.get(Scene);
    }
    protected get renderer() {
        return this.components.get(Renderer);
    }
    protected get reader() {
        return this.components.get(Reader);
    }

    getSceneComponent()
    {
        return this.components.get(Scene);
    }

    getCameraComponent()
    {
        return this.getChildComponent(Camera);
    }

    create()
    {
        this.name = "Presentation";

        this.createComponent(Scene);
        this.createComponent(Renderer);
        this.createComponent(Reader);
    }

    fromData(data: IPresentation, item?: Item)
    {
        const scene = this.components.get(Scene);

        // scene, nodes
        const nodes = data.scene.nodes;
        nodes.forEach(nodeIndex => {
            const node = data.nodes[nodeIndex];
            this.inflateNode(scene, node, data, item);
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
        const transforms = this.scene.children;

        if (transforms.length > 0) {
            presentationData.nodes = [];
            transforms.forEach(transform => {
                const index = this.deflateNode(transform, presentationData);
                presentationData.scene.nodes.push(index);
            });
        }

        // explorer settings
        presentationData.voyager = {
            renderer: this.renderer.toData(),
            reader: this.reader.toData()
        };

        return presentationData as IPresentation;
    }

    protected inflateNode(parent: Transform, nodeData: INodeData, presentationData: IPresentation, item?: Item)
    {
        let node;
        let referenceParsed = false;
        let name;

        if (nodeData.reference !== undefined) {
            const reference = presentationData.references[nodeData.reference];
            if (reference.mimeType === "application/si-dpo-3d.item+json") {
                if (Number(reference.uri) === 0 && item) {
                    node = item;
                    name = item.name;
                    this.items.push(item);
                    referenceParsed = true;
                }
            }
        }
        else if (nodeData.item !== undefined) {
            const itemData = presentationData.items[nodeData.item];
            const item = parent.graph.createCustomNode(Item);
            item.fromData(itemData, this.loaders, this.path);
            this.items.push(item);
            name = item.name;
        }

        if (!node) {
            node = parent.graph.createNode("Node");
            node.createComponent(Transform);
        }

        const transform = node.components.get(Transform);
        nodeParser.dataToTransform(nodeData, transform);
        parent.addChild(transform);

        if (nodeData.reference !== undefined && !referenceParsed) {
            const reference = presentationData.references[nodeData.reference];
            if (reference.mimeType === "application/si-dpo-3d.item+json") {
                if (Number(reference.uri) === 0) {
                    name = "Reference";
                    const reference = presentationData.references[nodeData.reference];
                    node.createComponent(Reference).fromData(reference);
                }
                else {
                    name = "Item";

                    // load external item referenced by uri
                    const itemUrl = resolvePathname(reference.uri, this.url);
                    this.loaders.loadJSON(itemUrl).then(json =>
                        this.loaders.validateItem(json).then(itemData => {
                            const item = node.createComponent(Item);
                            item.url = itemUrl;
                            item.setLoaders(this.loaders);
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
            const camera = presentationData.cameras[nodeData.camera];
            const component = node.createComponent(Camera);
            nodeParser.dataToCamera(camera, component);
        }
        else if (nodeData.light !== undefined) {
            name = "Light";
            const light = presentationData.lights[nodeData.light];

            if (light.type === "directional") {
                const component = node.createComponent(DirectionalLight);
                nodeParser.dataToDirectionalLight(light, component);
            }
            else if (light.type === "point") {
                const component = node.createComponent(PointLight);
                nodeParser.dataToPointLight(light, component);
            }
            else if (light.type === "spot") {
                const component = node.createComponent(SpotLight);
                nodeParser.dataToSpotLight(light, component);
            }
        }

        node.name = nodeData.name || name || "Node";

        if (nodeData.children) {
            nodeData.children.forEach(childIndex => {
                const child = presentationData.nodes[childIndex];
                this.inflateNode(transform, child, presentationData, item);
            })
        }
    }

    protected deflateNode(transform: Transform, pres: Partial<IPresentation>): Index
    {
        const nodeData: INodeData = nodeParser.transformToData(transform);
        const node = transform.node;
        if (node.name) {
            nodeData.name = node.name;
        }

        pres.nodes.push(nodeData);
        const index = pres.nodes.length - 1;

        const camera = transform.components.get(Camera);
        const light = transform.components.get(Light);
        const reference = transform.components.get(Reference);

        if (node instanceof Item) {
            pres.items = pres.items || [];
            pres.items.push(node.toData());
            nodeData.item = pres.items.length - 1;
        }
        else if (camera) {
            pres.cameras = pres.cameras || [];
            pres.cameras.push(nodeParser.cameraToData(camera));
            nodeData.camera = pres.cameras.length -1;
        }
        else if (light) {
            pres.lights = pres.lights || [];
            pres.lights.push(nodeParser.lightToData(light));
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
                const index = this.deflateNode(transform, pres);
                nodeData.children.push(index);
            })
        }

        return index;
    }
}
