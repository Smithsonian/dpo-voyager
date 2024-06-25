/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Dictionary, TypeOf } from "@ff/core/types";
import Publisher, { ITypedEvent } from "@ff/core/Publisher";
import { IObjectEvent } from "@ff/core/ObjectRegistry";

import Property, { types, IPropertySchema, IPropertyTemplate, PropertiesFromTemplates } from "./Property";
import PropertyGroup, { ILinkable } from "./PropertyGroup";
import ComponentTracker from "./ComponentTracker";
import ComponentReference from "./ComponentReference";
import Node, { NodeOrType } from "./Node";
import System from "./System";

////////////////////////////////////////////////////////////////////////////////

export { types, ITypedEvent, Node };


export interface IUpdateContext
{
}

export interface IComponentEvent<T extends Component = Component> extends IObjectEvent<T>
{
}

/**
 * Emitted by [[Component]] after the instance's state has changed.
 * @event
 */
export interface IComponentChangeEvent<T extends Component = Component> extends ITypedEvent<"change">
{
    component: T;
    what: string;
}

/**
 * Emitted by [[Component]] if the component is about to be disposed.
 * @event
 */
export interface IComponentDisposeEvent<T extends Component = Component> extends ITypedEvent<"dispose">
{
    component: T;
}

/** A [[Component]] instance, [[Component]] constructor function or a component's type string. */
export type ComponentOrType<T extends Component = Component> = T | TypeOf<T> | string;

////////////////////////////////////////////////////////////////////////////////

/**
 * Base class for components in a node-component system.
 *
 * ### Events
 * - *"change"* - emits [[IComponentChangeEvent]] after the component's state (except changed properties) has changed.
 * - *"update"* - emitted after the component has been updated due to changed properties.
 * - *"dispose"* - emits [[IComponentDisposeEvent]] if the component is about to be disposed.
 *
 * ### See also
 * - [[ComponentTracker]]
 * - [[ComponentLink]]
 * - [[ComponentType]]
 * - [[ComponentOrType]]
 * - [[Node]]
 * - [[Graph]]
 * - [[System]]
 */
export default class Component extends Publisher implements ILinkable
{
    static readonly typeName: string = "Component";

    static readonly text: string = "";
    static readonly icon: string = "";

    static readonly isNodeSingleton: boolean = true;
    static readonly isGraphSingleton: boolean = false;
    static readonly isSystemSingleton: boolean = false;

    static getTypeName<T extends Component>(scope?: ComponentOrType<T>): string
    {
        return typeof scope === "function" ? (scope as any).typeName : (typeof scope === "object"
            ? (scope.constructor as typeof Component).typeName : (scope || Component.typeName));
    }

    /** The component's globally unique id. */
    readonly id: string;
    readonly node: Node;

    ins: PropertyGroup = new PropertyGroup(this);
    outs: PropertyGroup = new PropertyGroup(this);

    changed: boolean = true;
    updated: boolean = false;

    private _name: string = "";
    private _tags = new Set<string>();
    private _trackers: ComponentTracker[] = [];

    /**
     * Protected constructor. Use [[Node.createComponent]] to create component instances.
     * @param node Node to attach the new component to.
     * @param id Unique id for the component.
     *
     * Note that during execution of the constructor, you have access to the component's
     * node, graph, and system. The component has not yet been advertised to other components though.
     */
    constructor(node: Node, id: string)
    {
        super({ knownEvents: false });

        this.node = node;
        this.id = id;
    }

    /**
     * Called after the component has been constructed and attached to a node.
     * Override to perform initialization tasks where you need access to other components.
     */
    create()
    {
        this.node._addComponent(this);

        // if graph is active, activate component
        if (this.graph.isActive && this.activate) {
            this.activate();
        }
    }

    /**
     * Removes the component from its node and deletes it.
     * Override to perform cleanup tasks (remove event listeners, etc.).
     * Must call super implementation if overridden!
     */
    dispose()
    {
        // deactivate component if graph is active
        if (this.graph.isActive && this.deactivate) {
            this.deactivate();
        }

        // emit dispose event
        this.emit<IComponentDisposeEvent>({ type: "dispose", component: this });

        // remove all links and trackers
        this.ins.dispose();
        this.outs.dispose();

        this._trackers.forEach(tracker => tracker.dispose());

        // remove component from node
        if (this.node) {
            this.node._removeComponent(this);

            // TODO: debug only
            (this as any).node = null;
        }
    }

    /**
     * True if the component is a node singleton, i.e. can only be added once per node.
     */
    get isNodeSingleton() {
        return (this.constructor as typeof Component).isNodeSingleton;
    }

    /**
     * True if the component is a graph singleton, i.e. can only be added once per graph.
     */
    get isGraphSingleton() {
        return (this.constructor as typeof Component).isGraphSingleton;
    }

    /**
     * True if the component is a system singleton, i.e. can only be added once per system.
     */
    get isSystemSingleton() {
        return (this.constructor as typeof Component).isSystemSingleton;
    }

    /**
     * Returns the type name of this component.
     * @returns {string}
     */
    get typeName() {
        return (this.constructor as typeof Component).typeName;
    }
    get displayTypeName() {
        const typeName = this.typeName;
        return typeName === "Component" ? typeName : typeName.substr(1);
    }

    get text() {
        return (this.constructor as typeof Component).text;
    }

    get icon() {
        return (this.constructor as typeof Component).icon;
    }

    /**
     * Returns the name of this component.
     */
    get name() {
        return this._name;
    }

    get displayName() {
        return this._name || this.text || this.displayTypeName;
    }

    /**
     * Sets the name of this component.
     * This emits an [[IComponentChangeEvent]].
     * @param value
     */
    set name(value: string)
    {
        this._name = value;
        this.emit<IComponentChangeEvent>({ type: "change", component: this, what: "name" });
    }

    /**
     * Returns the set of tags this component is associated with.
     */
    get tags(): Readonly<Set<string>> {
        return this._tags;
    }

    /**
     * Adds a tag to this component. Adding a tag that already exists has no effect.
     * @param tag The tag name. Valid tag names are all non-empty strings except "tag".
     */
    addTag(tag: string)
    {
        if (!this._tags.has(tag)) {
            this._tags.add(tag);
            this.node._addComponentTag(tag, this);
        }
    }

    /**
     * Removes a tag from this component. Removing a non-existing tag has no effect.
     * @param tag The tag name. Valid tag names are all non-empty strings except "tag".
     */
    removeTag(tag: string)
    {
        if (this._tags.has(tag)) {
            this._tags.delete(tag);
            this.node._removeComponentTag(tag, this);
        }
    }

    /**
     * Returns the graph this component and its node belong to.
     */
    get graph() {
        return this.node.graph;
    }

    /**
     * Returns the system this component and its node belong to.
     */
    get system(): System {
        return this.node.system;
    }

    /**
     * Returns the set of sibling components of this component.
     * Sibling components are components belonging to the same node.
     */
    get components() {
        return this.node.components;
    }

    /**
     * Returns true if the component's graph is active.
     */
    get isActive() {
        return this.graph.isActive;
    }

    getComponent<T extends Component = Component>(componentOrType?: ComponentOrType<T>, nothrow: boolean = false) {
        return this.node.components.get(componentOrType, nothrow);
    }

    getComponents<T extends Component = Component>(componentOrType?: ComponentOrType<T>) {
        return this.node.components.getArray(componentOrType);
    }

    getComponentsByTag<T extends Component = Component>(tag: string) {
        return this.node.components.getByTag(tag);
    }

    createComponent<T extends Component = Component>(componentOrType: ComponentOrType<T>)
    {
        return this.node.createComponent(componentOrType);
    }

    getOrCreateComponent<T extends Component = Component>(componentOrType: ComponentOrType<T>) {
        return this.node.components.get(componentOrType, true) || this.node.createComponent(componentOrType);
    }

    hasComponent(componentOrType: ComponentOrType) {
        return this.node.components.has(componentOrType);
    }

    getGraphComponent<T extends Component = Component>(componentOrType?: ComponentOrType<T>, nothrow: boolean = false) {
        return this.node.graph.components.get(componentOrType, nothrow);
    }

    getGraphComponents<T extends Component = Component>(componentOrType?: ComponentOrType<T>) {
        return this.node.graph.components.getArray(componentOrType);
    }

    getGraphComponentsByTag<T extends Component = Component>(tag: string) {
        return this.node.graph.components.getByTag(tag);
    }

    hasGraphComponent(componentOrType: ComponentOrType) {
        return this.node.graph.components.has(componentOrType);
    }

    getMainComponent<T extends Component = Component>(componentOrType?: ComponentOrType<T>, nothrow: boolean = false) {
        return this.node.system.graph.components.get(componentOrType, nothrow);
    }

    getMainComponents<T extends Component = Component>(componentOrType?: ComponentOrType<T>) {
        return this.node.system.graph.components.getArray(componentOrType);
    }

    getMainComponentsByTag<T extends Component = Component>(tag: string) {
        return this.node.system.graph.components.getByTag(tag);
    }

    hasMainComponent(componentOrType: ComponentOrType) {
        return this.node.system.graph.components.has(componentOrType);
    }

    getSystemComponent<T extends Component = Component>(componentOrType?: ComponentOrType<T>, nothrow: boolean = false) {
        return this.node.system.components.get(componentOrType, nothrow);
    }

    getSystemComponents<T extends Component = Component>(componentOrType?: ComponentOrType<T>) {
        return this.node.system.components.getArray(componentOrType);
    }

    getSystemComponentsByTag<T extends Component = Component>(tag: string) {
        return this.node.system.components.getByTag(tag);
    }

    hasSystemComponent(componentOrType: ComponentOrType) {
        return this.node.system.components.has(componentOrType);
    }

    getComponentById(id: string): Component | null {
        return this.node.system.components.getById(id);
    }

    getNode<T extends Node = Node>(nodeOrType?: NodeOrType<T>, nothrow: boolean = false) {
        return this.node.graph.nodes.get(nodeOrType, nothrow);
    }

    getNodes<T extends Node = Node>(nodeOrType?: NodeOrType<T>) {
        return this.node.graph.nodes.getArray(nodeOrType);
    }

    getNodesByTag<T extends Node = Node>(tag: string) {
        return this.node.graph.nodes.getByTag(tag);
    }

    hasNode(nodeOrType: NodeOrType) {
        return this.node.graph.nodes.has(nodeOrType);
    }

    getMainNode<T extends Node = Node>(nodeOrType?: NodeOrType<T>, nothrow: boolean = false) {
        return this.node.system.graph.nodes.get(nodeOrType, nothrow);
    }

    getMainNodes<T extends Node = Node>(nodeOrType?: NodeOrType<T>) {
        return this.node.system.graph.nodes.getArray(nodeOrType);
    }

    getMainNodesByTag<T extends Node = Node>(tag: string) {
        return this.node.system.graph.nodes.getByTag(tag);
    }

    hasMainNode(nodeOrType: NodeOrType) {
        return this.node.system.graph.nodes.has(nodeOrType);
    }

    getSystemNode<T extends Node = Node>(nodeOrType?: NodeOrType<T>, nothrow: boolean = false) {
        return this.node.system.nodes.get(nodeOrType, nothrow);
    }

    getSystemNodes<T extends Node = Node>(nodeOrType?: NodeOrType<T>) {
        return this.node.system.nodes.getArray(nodeOrType);
    }

    getSystemNodesByTag<T extends Node = Node>(tag: string) {
        return this.node.system.nodes.getByTag(tag);
    }

    hasSystemNode(nodeOrType: NodeOrType) {
        return this.node.system.nodes.has(nodeOrType);
    }

    getNodeById(id: string): Node | null {
        return this.node.system.nodes.getById(id);
    }

    activate()
    {
    }

    /**
     * Called during each cycle if the component's input properties have changed.
     * Override to update the status of the component based on the input properties.
     * @param context Information about the current update cycle.
     * @returns True if the state of the component has changed.
     */
    update(context: IUpdateContext): boolean
    {
        throw new Error("this should never be called");
    }

    /**
     * Called during each cycle, after the component has been updated.
     * Override to let the component perform regular tasks.
     * @param context Information about the current update cycle.
     * @returns True if the state of the component has changed.
     */
    tick(context: IUpdateContext): boolean
    {
        throw new Error("this should never be called");
    }

    /**
     * Called after rendering is completed.
     * Override to perform update operations which need to happen
     * only after all rendering is done.
     * @param context Information about the current update cycle.
     * @returns True if the state of the component has changed.
     */
    tock(context: IUpdateContext): boolean
    {
        throw new Error("this should never be called");
    }

    deactivate()
    {
    }

    requestSort()
    {
        this.graph.requestSort();
    }

    /**
     * Returns true if this component has or inherits from the given type.
     * @param scope
     */
    is(scope: ComponentOrType): boolean
    {
        const typeName = Component.getTypeName(scope);

        let prototype = this;

        do {
            prototype = Object.getPrototypeOf(prototype);

            if ((prototype.constructor as typeof Component).typeName === typeName) {
                return true;
            }

        } while ((prototype.constructor as typeof Component).typeName !== Component.typeName);

        return false;
    }

    /**
     * Removes links from all input and output properties.
     */
    unlinkAllProperties()
    {
        this.ins.unlinkAllProperties();
        this.outs.unlinkAllProperties();
    }

    /**
     * Sets the changed flags of this component and of all input properties to false;
     */
    resetChanged()
    {
        this.changed = false;

        const ins = this.ins.properties;
        for (let i = 0, n = ins.length; i < n; ++i) {
            ins[i].changed = false;
        }

        const outs = this.outs.properties;
        for (let i = 0, n = outs.length; i < n; ++i) {
            outs[i].changed = false;
        }
    }

    /**
     * Tracks the given component type. If a component of this type is added
     * to or removed from the node, it will be added or removed from the tracker.
     * @param {ComponentOrType} componentOrType
     * @param {(component: T) => void} didAdd
     * @param {(component: T) => void} willRemove
     */
    trackComponent<T extends Component>(componentOrType: ComponentOrType<T>,
        didAdd?: (component: T) => void, willRemove?: (component: T) => void): ComponentTracker<T>
    {
        const tracker = new ComponentTracker(this.node.components, componentOrType, didAdd, willRemove);
        this._trackers.push(tracker);
        return tracker;
    }

    /**
     * Returns a weak reference to a component.
     * The reference is set to null after the linked component is removed.
     * @param componentOrType The type of component this reference accepts, or the component to link.
     */
    referenceComponent<T extends Component>(componentOrType: ComponentOrType<T>): ComponentReference<T>
    {
        return new ComponentReference<T>(this.system, componentOrType);
    }

    /**
     * Returns a text representation of the component.
     * @returns {string}
     */
    toString()
    {
        return `${this.typeName}${this.name ? " (" + this.name + ")" : ""}`;
    }

    dump(indent: string = "")
    {
        console.log(indent + `%cComponent '${this.typeName}' (${this.displayName})`, "color: green");
        this.ins.properties.forEach(prop => prop.dump(indent + "  IN  "));
        this.outs.properties.forEach(prop => prop.dump(indent + "  OUT "));
    }

    toJSON()
    {
        let json: any = {};

        const jsonIns = this.ins.toJSON();
        if (jsonIns) {
            json.ins = jsonIns;
        }
        const jsonOuts = this.outs.toJSON();
        if (jsonOuts) {
            json.outs = jsonOuts;
        }

        return json;
    }

    fromJSON(json: any)
    {
        if (json.ins) {
            this.ins.fromJSON(json.ins);
        }
        if (json.outs) {
            this.outs.fromJSON(json.outs);
        }
    }

    referencesFromJSON(json: any)
    {
        const dict = this.system.components.getDictionary();

        if (json.ins) {
            this.ins.linksFromJSON(json.ins, dict);
        }
        if (json.outs) {
            this.outs.linksFromJSON(json.outs, dict);
        }
    }

    addCustomInput(path: string, schema: IPropertySchema, index?: number): Property
    {
        this.changed = true;
        return this.ins.createCustomProperty(path, schema, index);
    }

    allowCustomInput(schema: IPropertySchema): boolean
    {
        return false;
    }

    addCustomOutput(path: string, schema: IPropertySchema, index?: number): Property
    {
        return this.outs.createCustomProperty(path, schema, index);
    }

    allowCustomOutput(schema: IPropertySchema): boolean
    {
        return false;
    }

     /**
     * Adds input properties to the component, specified by the provided property templates.
     * @param templates A plain object with property templates.
     * @param index Optional index at which to insert the new properties.
     */
    protected addInputs<T extends Component = Component, U extends Dictionary<IPropertyTemplate> = {}>
    (templates: U, index?: number) : PropertyGroup & T["ins"] & PropertiesFromTemplates<U>
    {
        return this.ins.createProperties(templates, index) as any;
    }

    /**
     * Adds output properties to the component, specified by the provided property templates.
     * @param templates A plain object with property templates.
     * @param index Optional index at which to insert the new properties.
     */
    protected addOutputs<T extends Component = Component, U extends Dictionary<IPropertyTemplate> = {}>
    (templates: U, index?: number) : PropertyGroup & T["outs"] & PropertiesFromTemplates<U>
    {
        return this.outs.createProperties(templates, index) as any;
    }
}

Component.prototype.activate = null;
Component.prototype.update = null;
Component.prototype.tick = null;
Component.prototype.tock = null;
Component.prototype.deactivate = null;
