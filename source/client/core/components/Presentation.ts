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

import * as THREE from "three";
import resolvePathname from "resolve-pathname";

import { Index } from "@ff/core/types";

import Entity from "@ff/core/ecs/Entity";
import Component, { ComponentOrType } from "@ff/core/ecs/Component";
import Hierarchy from "@ff/core/ecs/Hierarchy";

import { IPresentation, INode, IVoyager } from "common/types";

import Transform from "../components/Transform";
import Scene from "../components/Scene";
import Reference from "../components/Reference";
import Camera from "../components/Camera";
import Light from "../components/Light";
import DirectionalLight from "../components/DirectionalLight";
import PointLight from "../components/PointLight";
import SpotLight from "../components/SpotLight";

import Item from "../components/Item";
import Documents from "../components/Documents";
import Groups from "../components/Groups";
import Tours from "../components/Tours";

import Explorer from "../components/Explorer";
import Renderer from "../components/Renderer";
import Reader from "../components/Reader";

import Loaders from "../loaders/Loaders";

////////////////////////////////////////////////////////////////////////////////

export default class Presentation extends Component
{
    static readonly type: string = "Presentation";

    url: string = "";

    protected loaders: Loaders = null;
    protected primaryCamera: Camera = null;
    protected lightsGroup: Entity = null;
    protected items: Item[] = [];

    create()
    {
        this.entity.createComponent(Documents);
        this.entity.createComponent(Groups);
        this.entity.createComponent(Tours);
        this.entity.createComponent(Scene);
    }

    get path(): string
    {
        return resolvePathname(".", this.url);
    }

    get cameraComponent(): Camera
    {
        return this.primaryCamera;
    }

    get cameraTransform(): Transform
    {
        return this.primaryCamera ? this.primaryCamera.transform : null;
    }

    get lightsTransform(): Transform
    {
        return this.lightsGroup ? this.lightsGroup.getComponent(Transform) : null;
    }

    get scene(): THREE.Scene | null
    {
        const component = this.getComponent(Scene);
        return component ? component.scene : null;
    }

    get camera(): THREE.Camera | null
    {
        return this.primaryCamera ? this.primaryCamera.camera : null;
    }

    setLoaders(loaders: Loaders)
    {
        this.loaders = loaders;
    }

    forEachItem(callback: (item: Item, index: number) => void)
    {
        this.items.forEach(callback);
    }

    forEachComponent<T extends Component>
        (componentOrType: ComponentOrType<T>, callback: (component: T) => void)
    {
        this.items.forEach(item => {
            const component = item.entity.getComponent(componentOrType);
            if (component) {
                callback(component as T);
            }
        });
    }

    getItemByEntity(entity: Entity): Item | null
    {
        for (let i = 0, n = this.items.length; i < n; ++i) {
            if (this.items[i].entity === entity) {
                return this.items[i];
            }
        }
    }

    fromData(data: IPresentation, item?: Item): this
    {
        const entity = this.entity;
        const scene = this.getComponent(Scene);

        // scene, nodes
        const nodes = data.scene.nodes;
        nodes.forEach(nodeIndex => {
            const node = data.nodes[nodeIndex];
            this.inflateNode(scene, node, data, item);
        });

        // Voyager settings
        const voyager: IVoyager = data.voyager || {};

        if (voyager.explorer) {
            const explorerComponent = entity.system.getComponent(Explorer);
            explorerComponent.fromData(voyager.explorer);
        }

        if (voyager.renderer) {
            const rendererComponent = entity.system.getComponent(Renderer);
            rendererComponent.fromData(voyager.renderer);
        }

        if (voyager.reader) {
            const readerComponent = entity.system.getComponent(Reader);
            readerComponent.fromData(voyager.reader);
        }

        this.primaryCamera = scene.getComponentInSubtree(Camera);
        this.lightsGroup = scene.findEntityInSubtree("Lights");

        return this;
    }

    toData(): IPresentation
    {
        const pres: Partial<IPresentation> = {};

        pres.asset = {
            copyright: "Copyright Smithsonian Institution",
            generator: "Voyager Presentation Parser",
            version: "1.0"
        };

        pres.scene = {
            nodes: []
        };

        // scene, nodes
        const transforms = this.getComponent(Scene).children;


        if (transforms.length > 0) {
            pres.nodes = [];
            transforms.forEach(transform => {
                const index = this.deflateNode(transform, pres);
                pres.scene.nodes.push(index);
            });
        }

        // explorer settings
        pres.voyager = {
            explorer: this.entity.system.getComponent(Explorer).toData(),
            renderer: this.entity.system.getComponent(Renderer).toData(),
            reader: this.entity.system.getComponent(Reader).toData()
        };

        return pres as IPresentation;
    }

    protected inflateNode(parent: Hierarchy, node: INode, pres: IPresentation, item?: Item)
    {
        let entity;
        let referenceParsed = false;
        let name;

        if (node.reference !== undefined) {
            const reference = pres.references[node.reference];
            if (reference.mimeType === "application/si-dpo-3d.item+json") {
                if (Number(reference.uri) === 0 && item) {
                    entity = item.entity;
                    name = entity.name;
                    this.items.push(item);
                    referenceParsed = true;
                }
            }
        }

        if (!entity) {
            entity = parent.createEntity("Node");
        }

        const transform = entity.getOrCreateComponent(Transform);
        transform.fromData(node);
        parent.addChild(transform);

        if (node.item !== undefined) {
            const itemData = pres.items[node.item];
            const item = entity.createComponent(Item);
            item.url = this.path;
            item.setLoaders(this.loaders);
            item.fromData(itemData);
            this.items.push(item);
            name = "Item";
        }
        else if (node.reference !== undefined && !referenceParsed) {
            const reference = pres.references[node.reference];
            if (reference.mimeType === "application/si-dpo-3d.item+json") {
                if (Number(reference.uri) === 0) {
                    name = "Reference";
                    const reference = pres.references[node.reference];
                    transform.createComponent(Reference).fromData(reference);
                }
                else {
                    name = "Item";

                    // load external item referenced by uri
                    const itemUrl = resolvePathname(reference.uri, this.url);
                    this.loaders.loadJSON(itemUrl).then(json =>
                        this.loaders.validateItem(json).then(itemData => {
                            const item = entity.createComponent(Item);
                            item.url = itemUrl;
                            item.setLoaders(this.loaders);
                            item.fromData(itemData);
                            this.items.push(item);
                        })
                    ).catch(error => {
                        console.log(`failed to create item from reference uri: ${error}`);
                        entity.name = "Reference";
                        const reference = pres.references[node.reference];
                        transform.createComponent(Reference).fromData(reference);
                    })
                }
            }
            else {
                name = "Reference";
                const reference = pres.references[node.reference];
                transform.createComponent(Reference).fromData(reference);
            }
        }
        else if (node.camera !== undefined) {
            name = "Camera";
            const camera = pres.cameras[node.camera];
            transform.createComponent(Camera).fromData(camera);
        }
        else if (node.light !== undefined) {
            name = "Light";
            const light = pres.lights[node.light];

            if (light.type === "directional") {
                transform.createComponent(DirectionalLight).fromData(light);
            }
            else if (light.type === "point") {
                transform.createComponent(PointLight).fromData(light);
            }
            else if (light.type === "spot") {
                transform.createComponent(SpotLight).fromData(light);
            }
        }

        entity.name = node.name || name || "Entity";

        if (node.children) {
            node.children.forEach(childIndex => {
                const child = pres.nodes[childIndex];
                this.inflateNode(transform, child, pres, item);
            })
        }
    }

    protected deflateNode(transform: Transform, pres: Partial<IPresentation>): Index
    {
        const node: INode = transform.toData();
        const entity = transform.entity;
        if (entity.name) {
            node.name = entity.name;
        }

        pres.nodes.push(node);
        const index = pres.nodes.length - 1;

        const cameraComponent = transform.getComponent(Camera);
        const lightComponent = transform.getComponent(Light);
        const referenceComponent = transform.getComponent(Reference);
        const itemComponent = transform.getComponent(Item);

        if (cameraComponent) {
            pres.cameras = pres.cameras || [];
            pres.cameras.push(cameraComponent.toData());
            node.camera = pres.cameras.length -1;
        }
        else if (lightComponent) {
            pres.lights = pres.lights || [];
            pres.lights.push(lightComponent.toData());
            node.light = pres.lights.length - 1;
        }
        else if (referenceComponent) {
            pres.references = pres.references || [];
            pres.references.push(referenceComponent.toData());
            node.reference = pres.references.length - 1;
        }
        else if (itemComponent) {
            pres.items = pres.items || [];
            pres.items.push(itemComponent.toData());
            node.item = pres.items.length - 1;
        }

        // deflate children
        const transforms = transform.children;
        if (transforms.length > 0) {
            node.children = [];
            transforms.forEach(transform => {
                const index = this.deflateNode(transform, pres);
                node.children.push(index);
            })
        }

        return index;
    }
}