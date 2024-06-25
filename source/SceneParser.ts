/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Object3D } from "three";

import Node from "@ff/graph/Node";
import Graph from "@ff/graph/Graph";
import CTransform from "./components/CTransform";
import CMesh from "./components/CMesh";
import CDirectionalLight from "./components/CDirectionalLight";
import CPointLight from "./components/CPointLight";
import CSpotLight from "./components/CSpotLight";
import CGeometry from "./components/CGeometry";

////////////////////////////////////////////////////////////////////////////////

export function parseScene(root: Object3D, graph: Graph, includeRoot: boolean)
{

}

function parse(object: any, parent: CTransform)
{
    let node: Node = null;

    if (object.isMesh) {
        node = parent.graph.createNode(object.name || "Mesh");
        const transform = node.createComponent(CTransform);
        parent.addChild(transform);

        const mesh = node.createComponent(CMesh);
        mesh.object3D = object;

        if (object.geometry) {
            const geometry = node.createComponent(CGeometry);
            geometry.geometry = object.geometry;
            geometry.outs.self.linkTo(mesh.ins.geometry);
        }

        if (object.material) {

        }
    }

    if (object.isDirectionalLight) {
        node = parent.graph.createNode(object.name || "Mesh");
        const transform = node.createComponent(CTransform);
        parent.addChild(transform);

        const light = node.createComponent(CDirectionalLight);
        light.object3D = object;
    }

    if (object.isPointLight) {
        node = parent.graph.createNode(object.name || "Mesh");
        const transform = node.createComponent(CTransform);
        parent.addChild(transform);

        const light = node.createComponent(CPointLight);
        light.object3D = object;

    }

    if (object.isSpotLight) {
        node = parent.graph.createNode(object.name || "Mesh");
        const transform = node.createComponent(CTransform);
        parent.addChild(transform);

        const light = node.createComponent(CSpotLight);
        light.object3D = object;
    }
}

