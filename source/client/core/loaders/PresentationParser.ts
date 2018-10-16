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

import { Index } from "@ff/core/types";
import Entity from "@ff/core/ecs/Entity";
import Hierarchy from "@ff/core/ecs/Hierarchy";

import MainCamera from "../components/MainCamera";
import Scene from "../components/Scene";
import Documents from "../components/Documents";
import Groups from "../components/Groups";
import Tours from "../components/Tours";

import Transform from "../components/Transform";
import Camera from "../components/Camera";
import Light from "../components/Light";
import DirectionalLight from "../components/DirectionalLight";
import PointLight from "../components/PointLight";
import SpotLight from "../components/SpotLight";
import Reference from "../components/Reference";

import Renderer from "../components/Renderer";
import Reader from "../components/Reader";

//import RenderSystem from "../system/RenderSystem";

import { IPresentation, INode, IExplorer, IItem } from "common/types/presentation";

import ItemParser from "./ItemParser";
import OrbitManipComponent from "../components/OrbitManip";
import Meta from "../components/Meta";

////////////////////////////////////////////////////////////////////////////////

export default class PresentationParser
{
    static inflate(entity: Entity, pres: IPresentation, item: IItem = null, merge: boolean = false)
    {
        const scene = entity.createComponent(Scene);
        entity.createComponent(MainCamera);

        entity.createComponent(Documents);
        entity.createComponent(Groups);
        entity.createComponent(Tours);

        // scene, nodes
        const nodes = pres.scene.nodes;
        nodes.forEach(nodeIndex => {
            const node = pres.nodes[nodeIndex];
            PresentationParser.inflateNode(scene, node, pres, item);
        });

        // explorer settings
        const explorer: IExplorer = pres.explorer || {};

        const rendererComponent = entity.getOrCreateComponent(Renderer);
        if (explorer.renderer) {
            rendererComponent.fromData(explorer.renderer);
        }

        const readerComponent = entity.getOrCreateComponent(Reader);
        if (explorer.reader) {
            readerComponent.fromData(explorer.reader);
        }
    }

    protected static inflateNode(parent: Hierarchy, node: INode, pres: IPresentation, item: IItem)
    {
        const entity = parent.createEntity();

        const transform = entity.createComponent(Transform);
        parent.addChild(transform);

        transform.fromData(node);

        let name = "Node";

        if (node.camera !== undefined) {
            name = "Camera";
            const camera = pres.cameras[node.camera];
            entity.createComponent(Camera).fromData(camera);
        }
        else if (node.light !== undefined) {
            name = "Light";
            const light = pres.lights[node.light];

            if (light.type === "directional") {
                entity.createComponent(DirectionalLight).fromData(light);
            }
            else if (light.type === "point") {
                entity.createComponent(PointLight).fromData(light);
            }
            else if (light.type === "spot") {
                entity.createComponent(SpotLight).fromData(light);
            }
        }
        else if (node.item !== undefined) {
            name = "Item";
            ItemParser.inflate(entity, pres.items[node.item]);
        }
        else if (node.reference !== undefined) {
            const reference = pres.references[node.reference];
            if (reference.mimeType === "application/si-dpo-3d.item+json") {
                name = "Item";
                ItemParser.inflate(entity, item);
            }
            else {
                name = "Reference";
                entity.createComponent(Reference).fromData(reference);
            }
        }

        entity.name = node.name || name;

        if (node.children) {
            node.children.forEach(childIndex => {
                const child = pres.nodes[childIndex];
                this.inflateNode(transform, child, pres, item);
            })
        }
    }

    static deflate(entity: Entity): IPresentation
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
        const scene = entity.getComponent(Scene);
        const transforms = scene.children;


        if (transforms.length > 0) {
            pres.nodes = [];
            transforms.forEach(transform => {
                const index = PresentationParser.deflateNode(transform, pres);
                pres.scene.nodes.push(index);
            });
        }

        // explorer settings
        pres.explorer = {
            renderer: entity.getComponent(Renderer).toData(),
            reader: entity.getComponent(Reader).toData()
        };

        return pres as IPresentation;
    }

    protected static deflateNode(transform: Transform, pres: Partial<IPresentation>): Index
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
            // here we assume the node is an item type
            pres.items = pres.items || [];
            pres.items.push(ItemParser.deflate(transform.entity));
            node.item = pres.items.length - 1;
        }

        // deflate children
        const transforms = transform.children;
        if (transforms.length > 0) {
            node.children = [];
            transforms.forEach(transform => {
                const index = PresentationParser.deflateNode(transform, pres);
                node.children.push(index);
            })
        }

        return index;
    }
}