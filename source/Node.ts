/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import uniqueId from "@ff/core/uniqueId";
import { Dictionary, TypeOf } from "@ff/core/types";
import Publisher, { ITypedEvent } from "@ff/core/Publisher";
import ObjectRegistry, { IObjectEvent } from "@ff/core/ObjectRegistry";

import { ILinkable } from "./PropertyGroup";
import Component, { ComponentOrType, IComponentEvent } from "./Component";
import Graph from "./Graph";
import CHierarchy, { IChildEvent } from "./components/CHierarchy";

////////////////////////////////////////////////////////////////////////////////

export { IComponentEvent }

export interface INodeEvent<T extends Node = Node> extends IObjectEvent<T>
{
}

/**
 * Emitted by [[Node]] after the instance's state has changed.
 * @event
 */
export interface INodeChangeEvent<T extends Node = Node> extends ITypedEvent<"change">
{
    node: T;
    what: string;
}

/**
 * Emitted by [[Node]] if the component is about to be disposed.
 * @event
 */
export interface INodeDisposeEvent<T extends Node = Node> extends ITypedEvent<"dispose">
{
    node: T;
}

/** A [[Node]] instance, [[Node]] constructor function or a node's type string. */
export type NodeOrType<T extends Node = Node> = T | TypeOf<T> | string;

/**
 * Node in an graph/node/component system.
 *
 * ### Events
 * - *"change"* - emits [[INodeChangeEvent]] after the node's state has changed.
 * - *"dispose"* - emits [[INodeDisposeEvent]] if the node is about to be disposed.
 *
 * ### See also
 * - [[Component]]
 * - [[Graph]]
 * - [[System]]
 */
export default class Node extends Publisher
{
    static readonly typeName: string = "Node";

    static readonly text: string = "";
    static readonly icon: string = "";

    static getTypeName<T extends Node>(scope?: NodeOrType<T>): string
    {
        return typeof scope === "function" ? (scope as any).typeName : (typeof scope === "object"
            ? (scope.constructor as typeof Node).typeName : (scope || Node.typeName));
    }

    /** The node's globally unique id. */
    readonly id: string;
    readonly graph: Graph = null;

    /** Collection of all components in this node. */
    readonly components = new ObjectRegistry<Component>(Component);

    private _name: string = "";
    private _tags = new Set<string>();
    private _isLocked: boolean = undefined;

    /**
     * Protected constructor. Please use [[Graph.createNode]] / [[Graph.createCustomNode]] to create node instances.
     * @param graph
     * @param id Unique id for the node. A unique id is usually created automatically,
     * do not specify except while de-serializing the component.
     *
     * Note that during execution of the constructor, the node is not yet attached to a graph/system.
     * Do not try to get access to other nodes, components, the parent graph, or the system here.
     */
    constructor(graph: Graph, id: string)
    {
        super({ knownEvents: false });

        this.graph = graph;
        this.id = id;
    }

    /**
     * Returns the class name of this node.
     */
    get typeName() {
        return (this.constructor as typeof Node).typeName;
    }
    get displayTypeName() {
        const typeName = this.typeName;
        return typeName === "Node" ? typeName : typeName.substr(1);
    }

    get isLocked() {
        return this._isLocked;
    }

    get text() {
        return (this.constructor as typeof Component).text;
    }

    get icon() {
        return (this.constructor as typeof Component).icon;
    }

    /**
     * Returns the name of this node.
     */
    get name() {
        return this._name;
    }

    get displayName() {
        return this._name || this.text || this.displayTypeName;
    }

    /**
     * Sets the name of this node.
     * This emits an [[INodeChangeEvent]]
     * @param value
     */
    set name(value: string) {
        this._name = value;
        this.emit<INodeChangeEvent>({ type: "change", what: "name", node: this });
    }

    /**
     * Returns the set of tags this node is associated with.
     */
    get tags(): Readonly<Set<string>> {
        return this._tags;
    }

    /**
     * Adds a tag to this node. Adding a tag that already exists has no effect.
     * @param tag The tag name. Valid tag names are all non-empty strings except "tag".
     */
    addTag(tag: string)
    {
        if (!this._tags.has(tag)) {
            this._tags.add(tag);
            this.graph._addNodeTag(tag, this);
        }
    }

    /**
     * Removes a tag from this node. Removing a non-existing tag has no effect.
     * @param tag The tag name. Valid tag names are all non-empty strings except "tag".
     */
    removeTag(tag: string)
    {
        if (this._tags.has(tag)) {
            this._tags.delete(tag);
            this.graph._removeNodeTag(tag, this);
        }
    }

    /**
     * Returns the system this node and its graph belong to.
     */
    get system() {
        return this.graph.system;
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

    getOrCreateComponent<T extends Component = Component>(componentOrType: ComponentOrType<T>) {
        return this.components.get(componentOrType, true) || this.createComponent(componentOrType);
    }

    hasComponent(componentOrType: ComponentOrType) {
        return this.components.has(componentOrType);
    }

    getGraphComponent<T extends Component = Component>(componentOrType?: ComponentOrType<T>, nothrow: boolean = false) {
        return this.graph.components.get(componentOrType, nothrow);
    }

    getGraphComponents<T extends Component = Component>(componentOrType?: ComponentOrType<T>) {
        return this.graph.components.getArray(componentOrType);
    }

    getGraphComponentsByTag<T extends Component = Component>(tag: string) {
        return this.graph.components.getByTag(tag);
    }

    hasGraphComponent(componentOrType: ComponentOrType) {
        return this.graph.components.has(componentOrType);
    }

    getMainComponent<T extends Component = Component>(componentOrType?: ComponentOrType<T>, nothrow: boolean = false) {
        return this.graph.system.graph.components.get(componentOrType, nothrow);
    }

    getMainComponents<T extends Component = Component>(componentOrType?: ComponentOrType<T>) {
        return this.graph.system.graph.components.getArray(componentOrType);
    }

    getMainComponentsByTag<T extends Component = Component>(tag: string) {
        return this.graph.system.graph.components.getByTag(tag);
    }

    hasMainComponent(componentOrType: ComponentOrType) {
        return this.graph.system.graph.components.has(componentOrType);
    }

    getSystemComponent<T extends Component = Component>(componentOrType?: ComponentOrType<T>, nothrow: boolean = false) {
        return this.graph.system.components.get(componentOrType, nothrow);
    }

    getSystemComponents<T extends Component = Component>(componentOrType?: ComponentOrType<T>) {
        return this.graph.system.components.getArray(componentOrType);
    }

    getSystemComponentsByTag<T extends Component = Component>(tag: string) {
        return this.graph.system.components.getByTag(tag);
    }

    hasSystemComponent(componentOrType: ComponentOrType) {
        return this.graph.system.components.has(componentOrType);
    }

    getComponentById(id: string): Component | null {
        return this.graph.system.components.getById(id);
    }

    getNode<T extends Node = Node>(nodeOrType?: NodeOrType<T>, nothrow: boolean = false) {
        return this.graph.nodes.get(nodeOrType, nothrow);
    }

    getNodes<T extends Node = Node>(nodeOrType?: NodeOrType<T>) {
        return this.graph.nodes.getArray(nodeOrType);
    }

    getNodesByTag<T extends Node = Node>(tag: string) {
        return this.graph.nodes.getByTag(tag);
    }

    hasNode(nodeOrType: NodeOrType) {
        return this.graph.nodes.has(nodeOrType);
    }

    getMainNode<T extends Node = Node>(nodeOrType?: NodeOrType<T>, nothrow: boolean = false) {
        return this.graph.system.graph.nodes.get(nodeOrType, nothrow);
    }

    getMainNodes<T extends Node = Node>(nodeOrType?: NodeOrType<T>) {
        return this.graph.system.graph.nodes.getArray(nodeOrType);
    }

    getMainNodesByTag<T extends Node = Node>(tag: string) {
        return this.graph.system.graph.nodes.getByTag(tag);
    }

    hasMainNode(nodeOrType: NodeOrType) {
        return this.graph.system.graph.nodes.has(nodeOrType);
    }

    getSystemNode<T extends Node = Node>(nodeOrType?: NodeOrType<T>, nothrow: boolean = false) {
        return this.graph.system.nodes.get(nodeOrType, nothrow);
    }

    getSystemNodes<T extends Node = Node>(nodeOrType?: NodeOrType<T>) {
        return this.graph.system.nodes.getArray(nodeOrType);
    }

    getSystemNodesByTag<T extends Node = Node>(tag: string) {
        return this.graph.system.nodes.getByTag(tag);
    }

    hasSystemNode(nodeOrType: NodeOrType) {
        return this.graph.system.nodes.has(nodeOrType);
    }

    getNodeById(id: string): Node | null {
        return this.graph.system.nodes.getById(id);
    }

    lock()
    {
        if (this._isLocked === false) {
            throw new Error("can't lock an unlocked node again");
        }

        this._isLocked = true;
    }

    unlock()
    {
        this._isLocked = false;
    }

    /**
     * Adds this node to the given graph and the system.
     */
    create()
    {
        this.graph._addNode(this);
    }

    /**
     * Override in custom node types to create a predefined set of components.
     * Note that this function is not called if a node is restored from serialization data.
     */
    createComponents()
    {
    }

    /**
     * Removes all components from this node.
     */
    clear()
    {
        // dispose components
        const componentList = this.components.getArray().slice();
        componentList.forEach(component => component.dispose());
    }

    /**
     * Must be called to delete/destroy the node. This unregisters the node
     * and all its components from the system.
     */
    dispose()
    {
        // dispose components
        const componentList = this.components.cloneArray().reverse();
        componentList.forEach(component => component.dispose());

        // emit dispose event
        this.emit<INodeDisposeEvent>({ type: "dispose", node: this });

        // remove node from system and graph
        if (this.graph) {
            this.graph._removeNode(this);

            // TODO: debug only
            (this as any).graph = null;
        }
    }

    /**
     * Creates a new component of the given type. Adds it to this node.
     * @param componentOrType Component constructor, type name, or instance.
     * @param name Optional name for the component.
     * @param id Optional unique identifier for the component (must omit unless serializing).
     */
    createComponent<T extends Component>(componentOrType: ComponentOrType<T>, name?: string, id?: string): T
    {
        if (this._isLocked === true) {
            throw new Error("node is locked, can't create component");
        }

        const type = this.system.registry.getType(componentOrType);
        if (!type) {
            throw new Error(`component type '${Component.getTypeName(componentOrType)}' not registered`);
        }

        const component = new type(this, id || uniqueId(12, this.system.components.getDictionary())) as T;
        component.create();

        if (name) {
            component.name = name;
        }

        return component;
    }

    /**
     * Tests whether the node is of or descends from the given type.
     * @param scope Node constructor, type name, or instance.
     */
    is(scope: NodeOrType): boolean
    {
        const typeName = Node.getTypeName(scope);

        let prototype = this;

        do {
            prototype = Object.getPrototypeOf(prototype);

            if ((prototype.constructor as typeof Node).typeName === typeName) {
                return true;
            }

        } while((prototype.constructor as typeof Node).typeName !== Node.typeName);

        return false;
    }

    /**
     * Returns a text representation of the node.
     * @param verbose
     */
    toString(verbose: boolean = false)
    {
        const components = this.components.getArray();
        const text = `Node '${this.name}' - ${components.length} components`;

        if (verbose) {
            return text + "\n" + components.map(component => "  " + component.toString()).join("\n");
        }

        return text;
    }

    dump(indent: string = "")
    {
        console.log(indent + `%cNode '${this.typeName}' (${this.displayName})`, "color: blue");
        this.components.getArray().forEach(comp => comp.dump(indent + "  "));
    }

    /**
     * Serializes the node and its components.
     * Return node serialization data, or null if the node should be excluded from serialization.
     */
    toJSON()
    {
        const json: any = {};
        const jsonComponents = [];

        if (this._isLocked) {
            json.locked = true;
        }

        const components = this.components.getArray();
        for (let i = 0, n = components.length; i < n; ++i) {
            const component = components[i];

            const jsonComp = this.componentToJSON(component);
            if (jsonComp) {
                jsonComp.type = component.typeName;
                jsonComp.id = component.id;

                if (component.name) {
                    jsonComp.name = component.name;
                }

                jsonComponents.push(jsonComp);
            }
        }

        if (jsonComponents.length > 0) {
            json.components = jsonComponents;
        }

        return json;
    }

    /**
     * Deserializes the node and its components.
     * @param json serialized node data.
     */
    fromJSON(json)
    {
        this._isLocked = !!json.locked;

        if (json.components) {
            json.components.forEach(jsonComp => this.componentFromJSON(jsonComp));
        }
    }

    /**
     * Override to control how components are deserialized.
     * @param jsonComp The JSON data for the component to be deserialized.
     */
    componentFromJSON(jsonComp)
    {
        const component = this.createComponent(jsonComp.type, jsonComp.name, jsonComp.id);
        component.fromJSON(jsonComp);
    }

    /**
     * Deserializes the links of all components.
     * @param json serialized component data.
     */
    referencesFromJSON(json)
    {
        if (json.components) {
            json.components.forEach(jsonComp => {
                const component = this.components.getById(jsonComp.id);
                component.referencesFromJSON(jsonComp);
            });
        }
    }

    /**
     * Override to control how components are serialized.
     * Return serialization data or null if the component should be excluded from serialization.
     * @param component The component to be serialized.
     */
    protected componentToJSON(component: Component)
    {
        return component.toJSON();
    }

    /**
     * Adds a component to the node, the node's graph and the system. Called by [[Component.attach]],
     * do not call directly.
     * @param component
     * @private
     */
    _addComponent(component: Component)
    {
        if (component.isNodeSingleton && this.components.has(component)) {
            throw new Error(`only one component of type '${component.typeName}' allowed per node`);
        }

        this.components.add(component);
        this.graph._addComponent(component);
    }

    /**
     * Removes a component from the node, the node's graph and the system. Called by [[Component.detach]],
     * do not call directly.
     * @param component
     * @private
     */
    _removeComponent(component: Component)
    {
        this.graph._removeComponent(component);
        this.components.remove(component);
    }

    _addComponentTag(tag: string, component: Component)
    {
        this.components.addByTag(tag, component);
        this.graph._addComponentTag(tag, component);
    }

    _removeComponentTag(tag: string, component: Component)
    {
        this.graph._removeComponentTag(tag, component);
        this.components.removeByTag(tag, component);
    }
}
