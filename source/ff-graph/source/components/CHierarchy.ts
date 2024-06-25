/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { IPropagatingEvent, ITypedEvent } from "@ff/core/Publisher";

import Component, { ComponentOrType, IComponentEvent, types } from "../Component";
import Node, { NodeOrType } from "../Node";
import CGraph from "./CGraph";

////////////////////////////////////////////////////////////////////////////////

export { Node };

const _hasChildComponents = (
    hierarchy: CHierarchy, componentOrType: ComponentOrType, recursive: boolean): boolean => {

    let hasComponent;

    const children = hierarchy.children;
    for (let i = 0, n = children.length; i < n; ++i) {
        hasComponent = children[i].components.has(componentOrType);

        if (hasComponent) {
            return true;
        }
    }

    if (recursive) {
        for (let i = 0, n = children.length; i < n; ++i) {
            hasComponent = _hasChildComponents(children[i], componentOrType, true);
            if (hasComponent) {
                return true;
            }
        }
    }

    return false;
};

const _getChildComponent = <T extends Component>(
    hierarchy: CHierarchy, componentOrType: ComponentOrType<T>, recursive: boolean): T | null => {

    let component;

    const children = hierarchy.children;
    for (let i = 0, n = children.length; i < n; ++i) {
        component = children[i].components.get(componentOrType);

        if (component) {
            return component;
        }
    }

    if (recursive) {
        for (let i = 0, n = children.length; i < n; ++i) {
            component = _getChildComponent(children[i], componentOrType, true);
            if (component) {
                return component;
            }
        }
    }

    return null;
};

const _getChildComponents = <T extends Component>(
    hierarchy: CHierarchy, componentOrType: ComponentOrType<T>, recursive: boolean): T[] => {

    let components = [];

    const children = hierarchy.children;
    for (let i = 0, n = children.length; i < n; ++i) {
        components = components.concat(children[i].components.getArray(componentOrType));
    }

    if (recursive) {
        for (let i = 0, n = children.length; i < n; ++i) {
            components = components.concat(_getChildComponents(children[i], componentOrType, true));
        }
    }

    return components;
};

////////////////////////////////////////////////////////////////////////////////

/**
 * Emitted by [[CHierarchy]] components if a hierarchy relation has changed above or below the component.
 * @event
 */
export interface IHierarchyEvent extends ITypedEvent<"hierarchy">
{
    parent: CHierarchy;
    child: CHierarchy;
    add: boolean;
    remove: boolean;
}

/**
 * Emitted by [[Hierarchy]] components if a child component has been added or removed below the component.
 * @event
 */
export interface IChildEvent extends ITypedEvent<"child">
{
    add: boolean;
    remove: boolean;
    component: Component;
}

/**
 * Allows arranging components in a hierarchical structure.
 *
 * ### Events
 * - *"hierarchy"* - emits [[IHierarchyEvent]] if a hierarchy relation has changed in the component's tree line.
 * - *"child-component"* - emits [[IChildComponentEvent]] if a child component has been added or removed.
 */
export default class CHierarchy extends Component
{
    static readonly typeName: string = "CHierarchy";

    protected _parent: CHierarchy = null;
    protected _children: CHierarchy[] = [];

    /**
     * Returns the parent component of this.
     * @returns {CHierarchy}
     */
    get parent(): CHierarchy
    {
        return this._parent;
    }

    /**
     * Returns an array of child components of this.
     * @returns {Readonly<CHierarchy[]>}
     */
    get children(): Readonly<CHierarchy[]>
    {
        return this._children || [];
    }

    create()
    {
        super.create();

        this.graph._addRoot(this);

        this.node.components.on(Component, this.onComponent, this);
    }

    dispose()
    {
        this.node.components.off(Component, this.onComponent, this);

        // dispose of all child nodes
        this._children.slice().forEach(child => child.node.dispose());

        // detach this from its parent
        if (this._parent) {
            this._parent.removeChild(this);
        }

        this.graph._removeRoot(this);

        super.dispose();
    }

    /**
     * Returns a component at the root of the hierarchy.
     * @returns A component of the given type that is a sibling of the root hierarchy component.
     */
    getRootComponent<T extends Component>(componentOrType: ComponentOrType<T>): T | null
    {
        let root: CHierarchy = this;
        while(root._parent) {
            root = root._parent;
        }

        return root ? root.node.components.get(componentOrType) : null;
    }

    /**
     * Returns a component from the parent node of the node of this component.
     * @param componentOrType
     * @param recursive If true, extends search to entire chain of ancestors,
     * including parent graphs.
     */
    getParentComponent<T extends Component>(componentOrType: ComponentOrType<T>, recursive: boolean): T | undefined
    {
        let parent: CHierarchy = this;

        while(true) {
            parent = parent._parent;

            // if at root, continue search at parent graph
            if (!parent) {
                const parentGraphComponent = this.graph.parent;
                parent = parentGraphComponent ? parentGraphComponent.components.get(CHierarchy) : undefined;
            }
            if (!parent) {
                return undefined;
            }

            const component = parent.node.components.get(componentOrType, true);

            if (component) {
                return component;
            }
            if (!recursive) {
                return undefined;
            }
        }
    }

    getParentNode<T extends Node>(nodeOrType: NodeOrType<T>, recursive: boolean): T | undefined
    {
        let parent: CHierarchy = this;

        while(true) {
            parent = parent._parent;

            // if at root, continue search at parent graph
            if (!parent) {
                const parentGraphComponent = this.graph.parent;
                parent = parentGraphComponent ? parentGraphComponent.components.get(CHierarchy) : undefined;
            }
            if (!parent) {
                return undefined;
            }

            const node = parent.node;
            if (node.is(nodeOrType)) {
                return node as T;
            }
            if (!recursive) {
                return undefined;
            }
        }
    }

    getSiblingNode<T extends Node>(nodeOrType: NodeOrType<T>): T | undefined
    {
        return this.getSiblingNodes(nodeOrType)[0];
    }

    getSiblingNodes<T extends Node>(nodeOrType: NodeOrType<T>): T[]
    {
        const thisParent = this._parent;

        return this.graph.nodes.getArray(nodeOrType).filter(node => {
            const hierarchy = node.components.get(CHierarchy);
            const parent = hierarchy ? hierarchy._parent : null;
            return parent == thisParent;
        });
    }

    hasChildComponents(componentOrType: ComponentOrType, recursive: boolean): boolean
    {
        return _hasChildComponents(this, componentOrType, recursive);
    }

    /**
     * Returns the child component of the given type.
     * @param componentOrType
     * @param recursive If true, extends search to entire subtree (breadth-first).
     */
    getChildComponent<T extends Component>(componentOrType: ComponentOrType<T>, recursive: boolean): T | null
    {
        return _getChildComponent(this, componentOrType, recursive);
    }

    /**
     * Returns all child components of the given type.
     * @param componentOrType
     * @param recursive If true, extends search to entire subtree (breadth-first).
     */
    getChildComponents<T extends Component>(componentOrType: ComponentOrType<T>, recursive: boolean): Readonly<T[]>
    {
        return _getChildComponents(this, componentOrType, recursive);
    }

    /**
     * Traverses the hierarchy up starting from this component. Executes the given callback function
     * for each visited component.
     * @param includeThis Includes this component in traversal.
     * @param includeSiblings For each hierarchy component, executes callback for all sibling components in the same node.
     * @param acrossGraphs When arriving at the root hierarchy component, continues traversal at the parent graph.
     * @param callback The callback function to execute for each visited component.
     */
    traverseUp(includeThis: boolean, includeSiblings: boolean, acrossGraphs: boolean, callback: (component: Component) => boolean)
    {
        if (includeThis) {
            if (includeSiblings) {
                const siblings = this.node.components.getArray();
                for (let i = 0, n = siblings.length; i < n; ++i) {
                    if (callback(siblings[i])) {
                        return;
                    }
                }
            }
            else if (callback(this)) {
                return;
            }
        }

        let parent = this._parent;

        if (!parent && acrossGraphs) {
            const graphComponent = this.node.graph.parent;
            parent = graphComponent ? graphComponent.getComponent(CHierarchy, true) : null;
        }

        if (parent) {
            parent.traverseUp(true, includeSiblings, acrossGraphs, callback);
        }
    }

    /**
     * Traverses the hierarchy down starting from this component. Executes the given callback function
     * for each visited component.
     * @param includeThis Includes this component in traversal.
     * @param includeSiblings For each hierarchy component, executes callback for all sibling components in the same node.
     * @param acrossGraphs Includes subgraphs in traversal.
     * @param callback The callback function to execute for each visited component.
     */
    traverseDown(includeThis: boolean, includeSiblings: boolean, acrossGraphs: boolean, callback: (component: Component) => boolean)
    {
        if (includeThis) {
            if (includeSiblings) {
                const siblings = this.node.components.getArray();
                for (let i = 0, n = siblings.length; i < n; ++i) {
                    if (callback(siblings[i])) {
                        return;
                    }
                }
            }
            else if (callback(this)) {
                return;
            }
        }

        if (acrossGraphs) {
            const graphs = this.node.components.getArray(CGraph);
            for (let i = 0, n = graphs.length; i < n; ++i) {
                const innerRoots = graphs[i].innerRoots;
                for (let j = 0, m = innerRoots.length; j < m; ++j) {
                    innerRoots[j].traverseDown(true, includeSiblings, acrossGraphs, callback);
                }
            }
        }

        const children = this._children;
        for (let i = 0, n = children.length; i < n; ++i) {
            children[i].traverseDown(true, includeSiblings, acrossGraphs, callback);
        }
    }

    /**
     * Emits the given event on this component and on all parent components.
     * Stops propagation as soon as `stopPropagation` is set to true on the event.
     * @param includeSiblings Also emits the event on all sibling components in the same node.
     * @param acrossGraphs When arriving at the root hierarchy component, continues traversal at the parent graph.
     * @param event The event to be emitted.
     */
    propagateUp(includeSiblings: boolean, acrossGraphs: boolean, event: IPropagatingEvent<string>)
    {
        this.traverseUp(true, includeSiblings, acrossGraphs, component => {
            component.emit(event);
            return event.stopPropagation;
        });
    }

    /**
     * Emits the given event on this component and on all child components.
     * Stops propagation as soon as `stopPropagation` is set to true on the event.
     * @param includeSiblings Also emits the event on all sibling components in the same node.
     * @param acrossGraphs Includes subgraphs in traversal.
     * @param event The event to be emitted.
     */
    propagateDown(includeSiblings: boolean, acrossGraphs: boolean, event: IPropagatingEvent<string>)
    {
        this.traverseDown(true, includeSiblings, acrossGraphs, component => {
            component.emit(event);
            return event.stopPropagation;
        });
    }

    /**
     * Adds another hierarchy component as a child to this component.
     * Emits a hierarchy event at this component, its node and all their parents.
     * @param {CHierarchy} component
     */
    addChild(component: CHierarchy)
    {
        if (component === this) {
            throw new Error("can't add self as child");
        }
        if (component._parent) {
            throw new Error("can't add child, component has a parent");
        }
        if (component.graph !== this.graph) {
            throw new Error("can't add child, component in different graph");
        }

        component._parent = this;
        this._children.push(component);

        this.graph._removeRoot(component);

        const event: IHierarchyEvent = {
            type: "hierarchy", add: true, remove: false, parent: this, child: component
        };

        this.traverseUp(true, false, true, component => component.emit(event));
        this.traverseDown(false, false, true, component => component.emit(event));
        this.system.emit<IHierarchyEvent>(event);
    }

    /**
     * Removes a child component from this hierarchy component.
     * Emits a hierarchy event at this component, its node and all their parents.
     * @param component
     */
    removeChild(component: CHierarchy)
    {
        if (component._parent !== this) {
            throw new Error("component not a child of this");
        }

        const event: IHierarchyEvent = {
            type: "hierarchy", add: false, remove: true, parent: this, child: component
        };

        this.traverseUp(true, false, true, component => component.emit(event));
        this.traverseDown(false, false, true, component => component.emit(event));
        this.system.emit<IHierarchyEvent>(event);

        const index = this._children.indexOf(component);
        this._children.splice(index, 1);
        component._parent = null;

        this.graph._addRoot(component);
    }

    protected onComponent(event: IComponentEvent)
    {
        if (event.object === this) {
            return;
        }

        const childEvent: IChildEvent = {
            type: "child",
            add: event.add,
            remove: event.remove,
            component: event.object
        };

        this.traverseUp(true, false, true, component => component.emit(childEvent));
    }

    toJSON()
    {
        const json = super.toJSON();

        if (this._children.length > 0) {
            json.children = this._children.map(child => child.id);
        }

        return json;
    }

    referencesFromJSON(json: any)
    {
        super.referencesFromJSON(json);

        const dict = this.system.components.getDictionary();

        if (json.children) {
            json.children.forEach(childId => {
                const child = dict[childId] as CHierarchy;
                this.addChild(child);
            })
        }
    }

    /**
     * Returns a text representation of this object.
     * @returns {string}
     */
    toString()
    {
        return super.toString() + ` - children: ${this.children.length}`;
    }

    dump(indent: string = "")
    {
        super.dump(indent);

        if (this.children.length > 0) {
            console.log(indent + "%cChildren", "color: purple");
            this.children.forEach(child => child.node.dump(indent + "  "));
        }
    }
}
