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
import HierarchyComponent from "@ff/core/ecs/Hierarchy";

import PickerComponent from "../components/Picker";
import MainCameraComponent from "../components/MainCamera";

import SceneComponent from "../components/Scene";
import DocumentsComponent from "../components/Documents";
import GroupsComponent from "../components/Groups";
import ToursComponent from "../components/Tours";

import TransformComponent from "../components/Transform";
import CameraComponent from "../components/Camera";
import LightComponent from "../components/Light";
import DirectionalLightComponent from "../components/DirectionalLight";
import PointLightComponent from "../components/PointLight";
import SpotLightComponent from "../components/SpotLight";
import ReferenceComponent from "../components/Reference";

import RendererComponent from "../components/Renderer";
import ReaderComponent from "../components/Reader";

import RenderSystem from "../system/RenderSystem";

import { IPresentation, INode, IExplorer } from "common/types/presentation";

import ItemParser from "./ItemParser";

////////////////////////////////////////////////////////////////////////////////

export default class PresentationParser
{
    static inflate(system: RenderSystem, pres: IPresentation, merge: boolean = false)
    {
        const entity = system.findOrCreateEntity("Main");

        const sceneComponent = entity.getOrCreateComponent(SceneComponent);

        entity.getOrCreateComponent(PickerComponent);
        entity.getOrCreateComponent(MainCameraComponent);

        entity.getOrCreateComponent(DocumentsComponent);
        entity.getOrCreateComponent(GroupsComponent);
        entity.getOrCreateComponent(ToursComponent);

        const skipCameras = merge && system.hasComponents(CameraComponent);
        const skipLights = merge && system.hasComponents(LightComponent);

        // scene, nodes
        const nodes = pres.scene.nodes;
        nodes.forEach(nodeIndex => {
            const node = pres.nodes[nodeIndex];
            PresentationParser.inflateNode(sceneComponent, node, pres, skipCameras, skipLights);
        });

        // explorer settings
        const explorer: IExplorer = pres.explorer || {};

        const rendererComponent = entity.getOrCreateComponent(RendererComponent);
        if (explorer.renderer) {
            rendererComponent.fromData(explorer.renderer);
        }

        const readerComponent = entity.getOrCreateComponent(ReaderComponent);
        if (explorer.reader) {
            readerComponent.fromData(explorer.reader);
        }
    }

    protected static inflateNode(parent: HierarchyComponent, node: INode, pres: IPresentation, skipCameras, skipLights)
    {
        if (skipLights && node.light !== undefined && !node.children) {
            return;
        }
        if (skipCameras && node.camera !== undefined && !node.children) {
            return;
        }

        const entity = parent.createEntity();
        let name = "Node";

        const transform = entity.createComponent(TransformComponent);
        parent.addChild(transform);

        transform.fromData(node);

        if (node.camera !== undefined && !skipCameras) {
            name = "Camera";
            const camera = pres.cameras[node.camera];
            entity.createComponent(CameraComponent).fromData(camera);
        }
        else if (node.light !== undefined && !skipLights) {
            name = "Light";
            const light = pres.lights[node.light];

            if (light.type === "directional") {
                entity.createComponent(DirectionalLightComponent).fromData(light);
            }
            else if (light.type === "point") {
                entity.createComponent(PointLightComponent).fromData(light);
            }
            else if (light.type === "spot") {
                entity.createComponent(SpotLightComponent).fromData(light);
            }
        }
        else if (node.item !== undefined) {
            name = "Item";
            const item = pres.items[node.item];
            ItemParser.inflate(entity, item);
        }
        else if (node.reference !== undefined) {
            name = "Reference";
            const reference = pres.references[node.reference];
            entity.createComponent(ReferenceComponent).fromData(reference);
        }

        entity.name = node.name || name;

        if (node.children) {
            node.children.forEach(childIndex => {
                const child = pres.nodes[childIndex];
                this.inflateNode(transform, child, pres, skipCameras, skipLights);
            })
        }
    }

    static deflate(system: RenderSystem): IPresentation
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
        const scene = system.getComponent(SceneComponent);
        const mainEntity = scene.entity;
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
            renderer: mainEntity.getComponent(RendererComponent).toData(),
            reader: mainEntity.getComponent(ReaderComponent).toData()
        };

        return pres as IPresentation;
    }

    protected static deflateNode(transform: TransformComponent, pres: Partial<IPresentation>): Index
    {
        const node: INode = transform.toData();
        pres.nodes.push(node);
        const index = pres.nodes.length - 1;

        const cameraComponent = transform.getComponent(CameraComponent);
        const lightComponent = transform.getComponent(LightComponent);
        const referenceComponent = transform.getComponent(ReferenceComponent);

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
        else {
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