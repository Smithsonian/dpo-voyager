/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Node from "@ff/graph/Node";
import Graph from "@ff/graph/Graph";

import {
    CBox,
    CCamera,
    CDirectionalLight,
    CMesh,
    CPhongMaterial,
    CPointLight,
    CScene,
    CSpotLight,
    CTorus,
    CTransform
} from "./components";

////////////////////////////////////////////////////////////////////////////////

const createScene = function(graph: Graph, name?: string): Node
{
    const node = graph.createNode(name);
    node.createComponent(CScene);
    return node;
};

const createTransform = function(parent: Node, name?: string): Node
{
    const transform = parent.getComponent(CTransform);
    if (!transform) {
        throw new Error("can't attach to parent; missing a hierarchy component");
    }

    const node = parent.graph.createNode(name);
    transform.addChild(node.createComponent(CTransform));
    return node;
};

const createCamera = function(parent: Node, name?: string): Node
{
    const node = createTransform(parent, name);
    node.createComponent(CCamera);
    return node;
};

const createDirectionalLight = function(parent: Node, name?: string): Node
{
    const node = createTransform(parent, name);
    node.createComponent(CDirectionalLight);
    return node;
};

const createPointLight = function(parent: Node, name?: string): Node
{
    const node = createTransform(parent, name);
    node.createComponent(CPointLight);
    return node;
};

const createSpotLight = function(parent: Node, name?: string): Node
{
    const node = createTransform(parent, name);
    node.createComponent(CSpotLight);
    return node;
};

const createBox = function(parent: Node, name?: string): Node
{
    const node = createTransform(parent, name);
    const mesh = node.createComponent(CMesh);
    const geo = node.createComponent(CBox);
    const mat = node.createComponent(CPhongMaterial);

    mesh.ins.geometry.linkFrom(geo.outs.self);
    mesh.ins.material.linkFrom(mat.outs.self);

    return node;
};

const createTorus = function(parent: Node, name?: string): Node
{
    const node = createTransform(parent, name);
    node.createComponent(CMesh);
    node.createComponent(CTorus);
    node.createComponent(CPhongMaterial);
    return node;
};

export {
    createScene,
    createTransform,
    createCamera,
    createDirectionalLight,
    createPointLight,
    createSpotLight,
    createBox,
    createTorus
};
