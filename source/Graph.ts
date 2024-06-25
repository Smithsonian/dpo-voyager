/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import uniqueId from "@ff/core/uniqueId";
import Publisher from "@ff/core/Publisher";

import LinkableSorter from "./LinkableSorter";
import Component, { ComponentOrType, IUpdateContext } from "./Component";
import Node, { NodeOrType } from "./Node";
import System from "./System";

import CHierarchy from "./components/CHierarchy";
import CGraph from "./components/CGraph";
import ObjectRegistry from "@ff/core/ObjectRegistry";

////////////////////////////////////////////////////////////////////////////////

/**
 * Graph in a graph/node/component system. A graph contains a collection of nodes.
 * Graphs can be nested, i.e. a graph can be a subgraph of another graph, the parent graph.
 *
 * ### See also
 * - [[Component]]
 * - [[Node]]
 * - [[System]]
 */
export default class Graph extends Publisher
{
    /** The system this graph belongs to. */
    readonly system: System;
    /** For subgraphs: the parent component. For the root graph (system graph), this is null. */
    readonly parent: CGraph;

    /** Collection of all nodes in this graph. */
    readonly nodes = new ObjectRegistry<Node>(Node);
    /** Collection of all components in this graph. */
    readonly components = new ObjectRegistry<Component>(Component);
    /** List of root hierarchy components in this graph. */
    readonly roots: CHierarchy[] = [];

    private _sorter = new LinkableSorter();
    private _sortRequested = true;
    private _sortedList: Readonly<Component[]> = null;
    private _tockList: Component[] = [];
    private _isActive = false;

    /**
     * Creates a new graph instance.
     * @param system System this graph belongs to.
     * @param parent Optional parent component of this graph.
     */
    constructor(system: System, parent: CGraph | null)
    {
        super({ knownEvents: false });

        this.system = system;
        this.parent = parent;
    }

    get isActive() {
        return this._isActive;
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

    hasComponent(componentOrType: ComponentOrType) {
        return this.components.has(componentOrType);
    }

    getMainComponent<T extends Component = Component>(componentOrType?: ComponentOrType<T>, nothrow: boolean = false) {
        return this.system.graph.components.get(componentOrType, nothrow);
    }

    getMainComponents<T extends Component = Component>(componentOrType?: ComponentOrType<T>) {
        return this.system.graph.components.getArray(componentOrType);
    }

    getMainComponentsByTag<T extends Component = Component>(tag: string) {
        return this.system.graph.components.getByTag(tag);
    }

    hasMainComponent(componentOrType: ComponentOrType) {
        return this.system.graph.components.has(componentOrType);
    }

    getSystemComponent<T extends Component = Component>(componentOrType?: ComponentOrType<T>, nothrow: boolean = false) {
        return this.system.components.get(componentOrType, nothrow);
    }

    getSystemComponents<T extends Component = Component>(componentOrType?: ComponentOrType<T>) {
        return this.system.components.getArray(componentOrType);
    }

    getSystemComponentsByTag<T extends Component = Component>(tag: string) {
        return this.system.components.getByTag(tag);
    }

    hasSystemComponent(componentOrType: ComponentOrType) {
        return this.system.components.has(componentOrType);
    }

    getComponentById(id: string): Component | null {
        return this.system.components.getById(id);
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

    hasNode(nodeOrType: NodeOrType) {
        return this.nodes.has(nodeOrType);
    }

    getMainNode<T extends Node = Node>(nodeOrType?: NodeOrType<T>, nothrow: boolean = false) {
        return this.system.graph.nodes.get(nodeOrType, nothrow);
    }

    getMainNodes<T extends Node = Node>(nodeOrType?: NodeOrType<T>) {
        return this.system.graph.nodes.getArray(nodeOrType);
    }

    getMainNodesByTag<T extends Node = Node>(tag: string) {
        return this.system.graph.nodes.getByTag(tag);
    }

    hasMainNode(nodeOrType: NodeOrType) {
        return this.system.graph.nodes.has(nodeOrType);
    }

    getSystemNode<T extends Node = Node>(nodeOrType?: NodeOrType<T>, nothrow: boolean = false) {
        return this.system.nodes.get(nodeOrType, nothrow);
    }

    getSystemNodes<T extends Node = Node>(nodeOrType?: NodeOrType<T>) {
        return this.system.nodes.getArray(nodeOrType);
    }

    getSystemNodesByTag<T extends Node = Node>(tag: string) {
        return this.system.nodes.getByTag(tag);
    }

    hasSystemNode(nodeOrType: NodeOrType) {
        return this.system.nodes.has(nodeOrType);
    }

    getNodeById(id: string): Node | null {
        return this.system.nodes.getById(id);
    }

    /**
     * Calls activate() on all components in the graph.
     * This is done before any calls to update(), tick(), and tock().
     */
    activate()
    {
        if (this._isActive) {
            return;
        }

        this._isActive = true;

        if (this._sortRequested) {
            this._sortRequested = false;
            this.sort();
        }

        const components = this._sortedList;
        for (let i = 0, n = components.length; i < n; ++i) {
            const component = components[i];
            if (component.activate) {
                component.activate();
            }
        }
    }

    /**
     * Calls deactivate() on all components in the graph.
     * After a call to deactivate, there are no more calls to update(), tick(), tock().
     */
    deactivate()
    {
        if (!this._isActive) {
            return;
        }

        this._isActive = false;

        const components = this._sortedList;
        for (let i = 0, n = components.length; i < n; ++i) {
            const component = components[i];
            if (component.deactivate) {
                component.deactivate();
            }
        }
    }

    /**
     * Called at the begin of each frame cycle. Calls update() on all components
     * in the graph whose changed flag is set, then calls tick() on all components.
     * Returns true if at least one component changed its state.
     * @param context Context-specific information such as time, etc.
     * @returns true if at least one component was updated.
     */
    tick(context: IUpdateContext): boolean
    {
        if (!this._isActive) {
            return;
        }

        if (this._sortRequested) {
            this._sortRequested = false;
            this.sort();
        }

        // call update on components in topological sort order
        const components = this._sortedList;
        let updated = false;

        for (let i = 0, n = components.length; i < n; ++i) {
            const component = components[i];
            component.updated = false;

            if (component.changed) {
                if (component.update && component.update(context)) {
                    component.updated = true;
                }

                if (component.tick && component.tick(context)) {
                    component.updated = true;
                }

                component.resetChanged();
            }
            else if (component.tick && component.tick(context)) {
                component.updated = true;
            }

            if (component.updated) {
                updated = true;
                component.emit("update");
            }
        }

        return updated;
    }

    /**
     * Calls tock() on all components in the graph.
     * The tock() call happens at the end of a frame cycle.
     * @param context Context-specific information such as time, etc.
     * @returns true if at least one component was updated.
     */
    tock(context: IUpdateContext): boolean
    {
        if (!this._isActive) {
            return;
        }

        const components = this._tockList;
        let updated = false;

        for (let i = 0, n = components.length; i < n; ++i) {
            updated = components[i].tock(context) || updated;
        }

        return updated;
    }

    /**
     * Removes all content, i.e. all nodes and components from the graph.
     */
    clear()
    {
        const nodes = this.nodes.cloneArray().reverse();
        for (let i = 0, n = nodes.length; i < n; ++i) {
            nodes[i].dispose();
        }

        if (this.nodes.length > 0) {
            throw new Error("graph not empty");
        }
    }

    /**
     * Requests a topological sort of the list of components based on how they are interlinked.
     * The sort is executed before the next update.
     */
    requestSort()
    {
        this._sortRequested = true;
    }

    sort()
    {
        this._sortedList = this._sorter.sort(this.components.getArray()) as Component[];

        const name = this.parent ? this.parent.name || this.parent.typeName : "System";

        if (ENV_DEVELOPMENT) {
            console.log("Graph.sort - %s: sorted %s components", name, this._sortedList.length);
            //this._sortedList.forEach((comp, index) => console.log("#%s - %s (node: %s)", index, comp.displayName, comp.node.displayName));
        }
    }

    /**
     * Creates a new node of the given type. Adds it to the graph.
     * @param nodeOrType Type of the node to create.
     * @param name Optional name for the node.
     * @param id Optional unique identifier for the node (must omit unless serializing).
     */
    createCustomNode<T extends Node>(nodeOrType: NodeOrType<T>, name?: string, id?: string): T
    {
        const type = this.system.registry.getType(nodeOrType);
        if (!type) {
            throw new Error(`node type '${Node.getTypeName(nodeOrType)}' not registered`);
        }

        const node = new type(this, id || uniqueId(12, this.system.nodes.getDictionary())) as T;
        node.create();

        if (name) {
            node.name = name;
        }

        if (!id) {
            // only if we're not serializing
            node.createComponents();

            // TODO: Temporarily disabled
            node.unlock();

            // prohibit adding/removing components
            //node.lock();
        }

        return node;
    }

    /**
     * Creates a new, plain, empty node (of base type [[Node]]). Adds it to the graph.
     * @param name Optional name for the node.
     * @param id Optional unique identifier for the node (must omit unless serializing).
     */
    createNode(name?: string, id?: string): Node
    {
        const node = new Node(this, id || uniqueId(12, this.system.nodes.getDictionary()));
        node.create();

        if (name) {
            node.name = name;
        }

        // allow adding/removing components
        node.unlock();

        return node;
    }

    findNodeByName<T extends Node = Node>(name: string, nodeOrType?: NodeOrType<T>): T | undefined
    {
        const nodes = this.nodes.getArray(nodeOrType);

        for (let i = 0, n = nodes.length; i < n; ++i) {
            if (nodes[i].name === name) {
                return nodes[i] as T;
            }
        }

        return undefined;
    }

    findRootNodes<T extends Node = Node>(nodeOrType?: NodeOrType<T>): T[]
    {
        const nodes = this.nodes.getArray(nodeOrType);
        const result = [];

        for (let i = 0, n = nodes.length; i < n; ++i) {
            const hierarchy = nodes[i].components.get<CHierarchy>("CHierarchy", true);
            if (!hierarchy || !hierarchy.parent) {
                result.push(nodes[i]);
            }
        }

        return result;
    }

    /**
     * Returns a text representation of the graph.
     * @param verbose
     */
    toString(verbose: boolean = false)
    {
        const nodes = this.nodes.getArray();
        const numComponents = this.components.count();

        const text = `Graph - ${nodes.length} nodes, ${numComponents} components.`;

        if (verbose) {
            return text + "\n" + nodes.map(node => node.toString(true)).join("\n");
        }

        return text;
    }

    dump(indent = "")
    {
        console.log(indent + "%cGraph", "color: red");
        const roots = this.findRootNodes();
        roots.forEach(node => node.dump(indent + "  "));
    }

    /**
     * Serializes the graph, its nodes and components.
     * Returns graph serialization data, which must be cloned or stringified immediately.
     */
    toJSON()
    {
        const json: any = {};
        const jsonNodes = [];

        const nodes = this.nodes.getArray();
        for (let i = 0, n = nodes.length; i < n; ++i) {
            const node = nodes[i];

            const jsonNode = this.nodeToJSON(node);

            jsonNode.type = node.typeName;
            jsonNode.id = node.id;

            if (node.name) {
                jsonNode.name = node.name;
            }

            jsonNodes.push(jsonNode);
        }

        if (jsonNodes.length > 0) {
            json.nodes = jsonNodes;
        }

        return json;
    }

    /**
     * Deserializes the graph, its nodes and components.
     * @param json serialized graph data.
     */
    fromJSON(json)
    {
        if (json.nodes) {
            json.nodes.forEach(jsonNode => {
                const node = this.createCustomNode(jsonNode.type, jsonNode.name, jsonNode.id);
                node.fromJSON(jsonNode);
            });

            // deserialize references between graphs, nodes, and components
            json.nodes.forEach(jsonNode => {
                const node = this.nodes.getById(jsonNode.id);
                node.referencesFromJSON(jsonNode);
            });
        }
    }

    /**
     * Override to control how nodes are serialized.
     * Return serialization data or null if the node should be excluded from serialization.
     * @param node The node to be serialized.
     */
    protected nodeToJSON(node: Node)
    {
        return node.toJSON();
    }

    /**
     * Adds a node to the graph and the system. Called by [[Node.attach]], do not call directly.
     * @param node
     * @private
     */
    _addNode(node: Node)
    {
        this.nodes.add(node);
        this.system._addNode(node);
    }

    /**
     * Removes a node from the graph and the system. Called by [[Node.detach]], do not call directly.
     * @param node
     * @private
     */
    _removeNode(node: Node)
    {
        this.system._removeNode(node);
        this.nodes.remove(node);
    }

    /**
     * Registers a node with a given tag.
     * @param tag
     * @param node
     * @private
     */
    _addNodeTag(tag: string, node: Node)
    {
        this.nodes.addByTag(tag, node);
        this.system._addNodeTag(tag, node);
    }

    /**
     * Unregisters a node from a given tag.
     * @param tag
     * @param node
     * @private
     */
    _removeNodeTag(tag: string, node: Node)
    {
        this.system._removeNodeTag(tag, node);
        this.nodes.removeByTag(tag, node);
    }

    /**
     * Adds a component to the graph and the system. Called by [[Component.attach]], do not call directly.
     * @param component
     * @private
     */
    _addComponent(component: Component)
    {
        if (component.isGraphSingleton && this.components.has(component)) {
            throw new Error(`only one component of type '${component.typeName}' allowed per graph`);
        }

        this.components.add(component);
        this.system._addComponent(component);

        if (component.tock) {
            this._tockList.push(component);
        }

        this._sortRequested = true;
    }

    /**
     * Removes a component from the graph and the system. Called by [[Component.dispose]], do not call directly.
     * @param component
     * @private
     */
    _removeComponent(component: Component)
    {
        this.system._removeComponent(component);
        this.components.remove(component);

        if (component.tock) {
            this._tockList.splice(this._tockList.indexOf(component), 1);
        }

        this._sortRequested = true;
    }

    /**
     * Registers a component with a given tag.
     * @param tag
     * @param component
     * @private
     */
    _addComponentTag(tag: string, component: Component)
    {
        this.components.addByTag(tag, component);
        this.system._addComponentTag(tag, component);
    }

    /**
     * Unregisters a component from a given tag.
     * @param tag
     * @param component
     * @private
     */
    _removeComponentTag(tag: string, component: Component)
    {
        this.system._removeComponentTag(tag, component);
        this.components.removeByTag(tag, component);
    }

    _addRoot(component: CHierarchy)
    {
        this.roots.push(component);

        if (this.parent) {
            this.parent.onAddInnerRoot(component);
        }
    }

    _removeRoot(component: CHierarchy)
    {
        if (this.parent) {
            this.parent.onRemoveInnerRoot(component);
        }

        this.roots.splice(this.roots.indexOf(component), 1);
    }
}
