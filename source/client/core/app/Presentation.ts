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

import System from "@ff/core/ecs/System";
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

import Documents from "../components/Documents";
import Groups from "../components/Groups";
import Tours from "../components/Tours";
import Meta from "../components/Meta";

import Explorer from "../components/Explorer";
import Renderer from "../components/Renderer";

import Loaders from "../loaders/Loaders";

import Item from "./Item";

////////////////////////////////////////////////////////////////////////////////

export default class Presentation
{
    readonly entity: Entity;

    protected presentationUrl: string;
    protected loaders: Loaders;

    protected _sceneComponent: Scene;
    protected _cameraComponent: Camera;
    protected lightsEntity: Entity;
    protected items: Item[];


    constructor(system: System, loaders: Loaders)
    {
        const entity = this.entity = system.createEntity("Presentation");

        this._sceneComponent = entity.createComponent(Scene);
        entity.createComponent(Documents);
        entity.createComponent(Groups);
        entity.createComponent(Tours);

        this._cameraComponent = null;
        this.lightsEntity = null;
        this.items = [];

        this.presentationUrl = "";
        this.loaders = loaders;
    }

    get url(): string
    {
        return this.presentationUrl;
    }

    get path(): string
    {
        return resolvePathname(".", this.presentationUrl);
    }

    get cameraComponent(): Camera
    {
        return this._cameraComponent;
    }

    get cameraTransform(): Transform
    {
        return this._cameraComponent ? this._cameraComponent.transform : null;
    }

    get lightsTransform(): Transform
    {
        return this.lightsEntity ? this.lightsEntity.getComponent(Transform) : null;
    }

    get sceneComponent(): Scene
    {
        return this._sceneComponent;
    }

    get scene(): THREE.Scene | null
    {
        return this._sceneComponent ? this._sceneComponent.scene : null;
    }

    get camera(): THREE.Camera | null
    {
        return this._cameraComponent ? this._cameraComponent.camera : null;
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

    dispose()
    {
        this.entity.dispose();
    }

    inflate(pres: IPresentation, url?: string, item?: Item): this
    {
        const entity = this.entity;
        const scene = this._sceneComponent;

        if (url) {
            this.presentationUrl = url;
        }

        // scene, nodes
        const nodes = pres.scene.nodes;
        nodes.forEach(nodeIndex => {
            const node = pres.nodes[nodeIndex];
            this.inflateNode(scene, node, pres, item);
        });

        // Voyager settings
        const voyager: IVoyager = pres.voyager || {};

        const explorerComponent = entity.getComponent(Explorer);
        if (voyager.explorer) {
            explorerComponent.fromData(voyager.explorer);
        }

        const rendererComponent = entity.getComponent(Renderer);
        if (voyager.renderer) {
            rendererComponent.fromData(voyager.renderer);
        }

        this._cameraComponent = scene.getComponentInSubtree(Camera);
        this.lightsEntity = scene.findEntityInSubtree("Lights");

        return this;
    }

    deflate(): IPresentation
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
        const transforms = this._sceneComponent.children;


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
            renderer: this.entity.system.getComponent(Renderer).toData()
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
            const item = new Item(entity, this.loaders).inflate(itemData, this.path);
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
                    const itemUrl = resolvePathname(reference.uri, this.presentationUrl);
                    this.loaders.loadJSON(itemUrl).then(json =>
                        this.loaders.validateItem(json).then(itemData => {
                            const item = new Item(entity, this.loaders).inflate(itemData, itemUrl);
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
        const metaComponent = transform.getComponent(Meta);

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
        else if (metaComponent) {
            const item = this.items.find(item => item.entity === transform.entity);
            if (item) {
                pres.items = pres.items || [];
                pres.items.push(item.deflate());
                node.item = pres.items.length - 1;
            }
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