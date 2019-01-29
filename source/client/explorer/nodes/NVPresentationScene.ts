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

import math from "@ff/core/math";
import Graph from "@ff/graph/Graph";

import NTransform from "@ff/scene/nodes/NTransform";
import NScene from "@ff/scene/nodes/NScene";
import NCamera, { EProjection } from "@ff/scene/nodes/NCamera";
import NLight from "@ff/scene/nodes/NLight";
import NDirectionalLight from "@ff/scene/nodes/NDirectionalLight";
import NPointLight from "@ff/scene/nodes/NPointLight";
import NSpotLight from "@ff/scene/nodes/NSpotLight";

import CTransform from "@ff/scene/components/CTransform";

import {
    IPresentation,
    INode,
    ICamera,
    ILight,
    TVector3
} from "common/types/presentation";

import CVLoaders from "../../core/components/CVLoaders";
import CVScene from "../../core/components/CVScene";
import CVItemData from "../components/CVItemData";

import NVPresentationSetup from "./NVPresentationSetup";
import NVReference from "./NVReference";
import NVItem from "./NVItem";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();

export type ReferenceCallback = (index: number, graph: Graph, assetPath: string) => NTransform;


export default class NVPresentationScene extends NScene
{
    static readonly type: string = "NVPresentationScene";

    url: string;
    assetPath: string;

    get scene() {
        return this.components.safeGet(CVScene);
    }
    get loadingManager() {
        return this.system.components.safeGet(CVLoaders);
    }

    setUrl(url: string, assetPath?: string)
    {
        this.url = url;
        this.assetPath = assetPath || resolvePathname(".", url);
    }

    createComponents()
    {
        this.createComponent(CVScene);
        this.name = "Scene";
    }

    deflate()
    {
        const data = this.toData();
        return data ? { data } : null;
    }

    inflate(json: any)
    {
        if (json.data) {
            this.fromData(json);
        }
    }

    toData(writeReferences?: boolean): IPresentation
    {
        const refIndex = writeReferences ? 0 : undefined;

        const data: Partial<IPresentation> = {
            scene: { nodes: [] }
        };

        const children = this.scene.children;

        if (children.length > 0) {
            data.nodes = [];

            children.forEach(child => {
                const node = child.node;
                if (node instanceof NTransform) {
                    const index = this.nodeToData(node, data, refIndex);
                    data.scene.nodes.push(index);
                }
            });
        }

        return data as IPresentation;
    }

    fromData(data: IPresentation, callback?: ReferenceCallback)
    {
        const nodes = data.scene.nodes;
        nodes.forEach(nodeIndex => {
            const nodeData = data.nodes[nodeIndex];
            this.nodeFromData(this, nodeData, data, callback);
        });
    }

    // DEFLATE PRESENTATION SCENE NODES

    protected nodeToData(node: NTransform, data: Partial<IPresentation>, refIndex: number): number
    {
        const nodeData = this.transformToData(node.transform);

        if (node.name) {
            nodeData.name = node.name;
        }

        const index = data.nodes.length;
        data.nodes.push(nodeData);

        if (node instanceof NVItem) {
            if (refIndex === undefined) {
                data.items = data.items || [];
                nodeData.item = data.items.length;
                data.items.push(node.item.toData());
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
        else if (node instanceof NCamera) {
            data.cameras = data.cameras || [];
            nodeData.camera = data.cameras.length;
            data.cameras.push(this.cameraToData(node));
        }
        else if (node instanceof NLight) {
            data.lights = data.lights || [];
            nodeData.light = data.lights.length;
            data.lights.push(this.lightToData(node));
        }

        // deflate children
        const transforms = node.transform.children;
        if (transforms.length > 0) {
            nodeData.children = [];
            transforms.forEach(transform => {
                const node = transform.node;
                if (node instanceof NTransform && !node.is(NVPresentationSetup)) {
                    const index = this.nodeToData(node, data, refIndex);
                    nodeData.children.push(index);
                }
            });
        }

        return index;
    }

    protected transformToData(component: CTransform): Partial<INode>
    {
        component.object3D.matrix.decompose(_vec3a, _quat, _vec3b);

        const data: Partial<INode> = {};

        if (_vec3a.x !== 0 || _vec3a.y !== 0 || _vec3a.z !== 0) {
            data.translation = _vec3a.toArray();
        }
        if (_quat.x !== 0 || _quat.y !== 0 || _quat.z !== 0 || _quat.w !== 1) {
            data.rotation = _quat.toArray();
        }
        if (_vec3b.x !== 1 || _vec3b.y !== 1 || _vec3b.z !== 1) {
            data.scale = _vec3b.toArray();
        }

        return data;
    }

    protected cameraToData(node: NCamera): ICamera
    {
        const ins = node.camera.ins;
        const data: Partial<ICamera> = {};

        if (ins.projection.getValidatedValue() === EProjection.Perspective) {
            data.type = "perspective";
            data.perspective = {
                yfov: ins.fov.value,
                znear: ins.near.value,
                zfar: ins.far.value
            };
        }
        else {
            data.type = "orthographic";
            data.orthographic = {
                ymag: ins.size.value,
                znear: ins.near.value,
                zfar: ins.far.value
            }
        }

        return data as ICamera;
    }

    protected lightToData(node: NLight): ILight
    {
        const ins = node.light.ins as any;

        const data: Partial<ILight> = {
            color: ins.color.value.slice() as TVector3,
            intensity: ins.intensity.value
        };

        switch(node.type) {
            case NDirectionalLight.type:
                data.type = "directional";
                break;

            case NPointLight.type:
                data.type = "point";
                data.point = {
                    distance: ins.distance.value,
                    decay: ins.decay.value
                };
                break;

            case NSpotLight.type:
                data.type = "spot";
                data.spot = {
                    distance: ins.distance.value,
                    decay: ins.decay.value,
                    angle: ins.angle.value,
                    penumbra: ins.penumbra.value
                };
                break;

            default:
                throw new Error(`unsupported light type: '${node.type}'`);
        }

        return data as ILight;
    }

    // INFLATE PRESENTATION SCENE NODES

    protected nodeFromData(parent: NTransform, nodeData: INode, presData: IPresentation, callback: ReferenceCallback)
    {
        let node = null;

        if (isFinite(nodeData.reference)) {
            const referenceData = presData.references[nodeData.reference];

            if (referenceData.mimeType === CVItemData.mimeType) {

                const index = Number(referenceData.uri);
                if (isFinite(index)) {
                    node = callback && callback(index, this.graph, this.assetPath);
                }
                else {
                    // node is reference, try to load external reference
                    const itemUrl = resolvePathname(referenceData.uri, this.assetPath);
                    const loadingManager = this.loadingManager;
                    node = this.graph.createCustomNode(NVItem);
                    node.item.setUrl(itemUrl);

                    loadingManager.loadJSON(itemUrl).then(json =>
                        loadingManager.validateItem(json).then(itemData => {
                            node.item.fromData(itemData);
                        })
                    ).catch(error => {
                        console.warn(`failed to create item from reference uri: ${error}`);
                    });
                }
            }

            if (!node) {
                node = this.graph.createCustomNode(NVReference);
                node.fromData(referenceData);
            }
        }
        else if (isFinite(nodeData.item)) {
            const itemData = presData.items[nodeData.item];
            node = this.graph.createCustomNode(NVItem);
            node.item.fromData(itemData);
        }
        else if (isFinite(nodeData.camera)) {
            const cameraData = presData.cameras[nodeData.camera];
            node = this.cameraFromData(cameraData);
        }
        else if (isFinite(nodeData.light)) {
            const lightData = presData.lights[nodeData.light];
            node = this.lightFromData(lightData);
        }
        else {
            node = this.graph.createCustomNode(NTransform);
        }

        if (nodeData.name) {
            node.name = nodeData.name;
        }

        this.transformFromData(nodeData, node.transform);

        parent.transform.addChild(node.transform);

        if (nodeData.children) {
            nodeData.children.forEach(childIndex => {
                const childData = presData.nodes[childIndex];
                this.nodeFromData(node, childData, presData, callback);
            })
        }
    }

    protected transformFromData(nodeData: INode, component: CTransform)
    {
        const { position, rotation, order, scale } = component.ins;

        order.setValue(0);

        if (nodeData.matrix) {
            _mat4.fromArray(nodeData.matrix);
            _mat4.decompose(_vec3a, _quat, _vec3b);
            _vec3a.toArray(position.value);
            _euler.setFromQuaternion(_quat, "XYZ");
            _euler.toVector3(_vec3a).multiplyScalar(math.RAD2DEG).toArray(rotation.value);
            _vec3b.toArray(scale.value);

            position.set();
            rotation.set();
            scale.set();
        }
        else {
            if (nodeData.translation) {
                position.setValue(nodeData.translation.slice());
            }
            if (nodeData.rotation) {
                _quat.fromArray(nodeData.rotation);
                _euler.setFromQuaternion(_quat, "XYZ");
                _euler.toVector3(_vec3a).multiplyScalar(math.RAD2DEG).toArray(rotation.value);
                rotation.set();
            }
            if (nodeData.scale) {
                scale.setValue(nodeData.scale.slice());
            }

            // this updates the matrix from the PRS properties
            component.changed = true;
        }
    }

    protected cameraFromData(cameraData: ICamera): NCamera
    {
        const node = this.graph.createCustomNode(NCamera);

        if (cameraData.type === "perspective") {
            node.camera.ins.copyValues({
                projection: EProjection.Perspective,
                fov: cameraData.perspective.yfov,
                near: cameraData.perspective.znear,
                far: cameraData.perspective.zfar
            });
        }
        else {
            node.camera.ins.copyValues({
                projection: EProjection.Orthographic,
                size: cameraData.orthographic.ymag,
                near: cameraData.orthographic.znear,
                far: cameraData.orthographic.zfar
            });
        }

        return node;

    }

    protected lightFromData(lightData: ILight): NLight
    {
        let node: NLight;

        switch(lightData.type) {
            case "directional":
                node = this.graph.createCustomNode(NDirectionalLight);

                node.light.ins.copyValues({
                    position: [ 0, 0, 0 ],
                    target: [ 0, 0, 0 ]
                });
                break;

            case "point":
                node = this.graph.createCustomNode(NPointLight);

                node.light.ins.copyValues({
                    distance: lightData.point.distance || 0,
                    decay: lightData.point.decay !== undefined ? lightData.point.decay : 1
                });
                break;

            case "spot":
                node = this.graph.createCustomNode(NSpotLight);

                node.light.ins.copyValues({
                    distance: lightData.point.distance || 0,
                    decay: lightData.point.decay !== undefined ? lightData.point.decay : 1,
                    angle: lightData.spot.angle !== undefined ? lightData.spot.angle : Math.PI / 4,
                    penumbra: lightData.spot.penumbra || 0
                });
                break;

            default:
                throw new Error(`unsupported light type: '${lightData.type}'`);
        }

        node.light.ins.copyValues({
            color: lightData.color !== undefined ? lightData.color.slice() : [ 1, 1, 1 ],
            intensity: lightData.intensity !== undefined ? lightData.intensity : 1
        });

        return node;
    }

}