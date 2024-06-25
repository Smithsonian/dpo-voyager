/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Publisher from "@ff/core/Publisher";
import ObjectRegistry from "@ff/core/ObjectRegistry";
import TypeRegistry from "@ff/core/TypeRegistry";

import Component, { ComponentOrType, IComponentEvent } from "./Component";
import Node, { INodeEvent, NodeOrType } from "./Node";
import Graph from "./Graph";

////////////////////////////////////////////////////////////////////////////////

export { IComponentEvent, INodeEvent };

export default class System extends Publisher
{
    readonly registry: TypeRegistry;
    readonly graph: Graph;

    readonly nodes = new ObjectRegistry<Node>(Node);
    readonly components = new ObjectRegistry<Component>(Component);


    constructor(registry?: TypeRegistry)
    {
        super({ knownEvents: false });

        this.registry = registry || new TypeRegistry();

        // create the main graph and activate it by default
        this.graph = new Graph(this, null);
        this.graph.activate();
    }

    getComponent<T extends Component = Component>(componentOrType?: ComponentOrType<T>, nothrow: boolean = false) {
        return this.components.get(componentOrType, nothrow);
    }

    getComponents<T extends Component = Component>(componentOrType?: ComponentOrType<T>) {
        return this.components.getArray(componentOrType);
    }

    getComponentsByTag<T extends Component = Component>(tag: string) {
        return this.components.getByTag(tag);
    }

    hasComponents(componentOrType: ComponentOrType) {
        return this.components.has(componentOrType);
    }

    getMainComponent<T extends Component = Component>(componentOrType?: ComponentOrType<T>, nothrow: boolean = false) {
        return this.graph.components.get(componentOrType, nothrow);
    }

    getMainComponents<T extends Component = Component>(componentOrType?: ComponentOrType<T>) {
        return this.graph.components.getArray(componentOrType);
    }

    getMainComponentsByTag<T extends Component = Component>(tag: string) {
        return this.graph.components.getByTag(tag);
    }

    hasMainComponents(componentOrType: ComponentOrType) {
        return this.graph.components.has(componentOrType);
    }

    getNode<T extends Node = Node>(nodeOrType?: NodeOrType<T>, nothrow: boolean = false) {
        return this.nodes.get(nodeOrType, nothrow);
    }

    getNodes<T extends Node = Node>(nodeOrType?: NodeOrType<T>) {
        return this.nodes.getArray(nodeOrType);
    }

    getNodesByTag<T extends Node = Node>(tag: string) {
        return this.nodes.getByTag(tag);
    }

    hasNodes(nodeOrType: NodeOrType) {
        return this.nodes.has(nodeOrType);
    }

    getMainNode<T extends Node = Node>(nodeOrType?: NodeOrType<T>, nothrow: boolean = false) {
        return this.graph.nodes.get(nodeOrType, nothrow);
    }

    getMainNodes<T extends Node = Node>(nodeOrType?: NodeOrType<T>) {
        return this.graph.nodes.getArray(nodeOrType);
    }

    getMainNodesByTag<T extends Node = Node>(tag: string) {
        return this.graph.nodes.getByTag(tag);
    }

    hasMainNodes(nodeOrType: NodeOrType) {
        return this.graph.nodes.has(nodeOrType);
    }

    findNodeByName<T extends Node = Node>(name: string, nodeOrType?: NodeOrType<T>): T | undefined
    {
        const nodes = this.nodes.getArray(nodeOrType);

        for (let i = 0, n = nodes.length; i < n; ++i) {
            if (nodes[i].name === name) {
                return nodes[i];
            }
        }

        return undefined;
    }

    /**
     * Serializes the content of the system, ready to be stringified.
     */
    toJSON()
    {
        return this.graph.toJSON();
    }

    /**
     * Deserializes the given JSON object.
     * @param json
     */
    fromJSON(json)
    {
        this.graph.clear();
        this.graph.fromJSON(json);
    }

    toString(verbose: boolean = false)
    {
        const nodes = this.nodes.getArray();
        const numComponents = this.components.count();

        const text = `System - ${nodes.length} nodes, ${numComponents} components.`;

        if (verbose) {
            return text + "\n" + nodes.map(node => node.toString(true)).join("\n");
        }

        return text;
    }

    _addNode(node: Node)
    {
        this.nodes.add(node);
    }

    _removeNode(node: Node)
    {
        this.nodes.remove(node);
    }

    _addNodeTag(tag: string, node: Node)
    {
        this.nodes.addByTag(tag, node);
    }

    _removeNodeTag(tag: string, node: Node)
    {
        this.nodes.removeByTag(tag, node);
    }

    _addComponent(component: Component)
    {
        if (component.isSystemSingleton && this.components.has(component)) {
            throw new Error(`only one component of type '${component.typeName}' allowed per system`);
        }

        this.components.add(component);
    }

    _removeComponent(component: Component)
    {
        this.components.remove(component);
    }

    _addComponentTag(tag: string, component: Component)
    {
        this.components.addByTag(tag, component);
    }

    _removeComponentTag(tag: string, component: Component)
    {
        this.components.removeByTag(tag, component);
    }
}
