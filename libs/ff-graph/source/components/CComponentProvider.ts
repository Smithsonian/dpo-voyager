/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Component, { ComponentOrType, ITypedEvent } from "../Component";

import Node from "../Node";
import CGraph from "./CGraph";
import CSelection, { INodeEvent, IComponentEvent } from "./CSelection";

////////////////////////////////////////////////////////////////////////////////

export enum EComponentScope {
    // Components in the given scoped node.
    Node,
    // Components in the given scoped graph.
    Graph,
    // Components in the main graph.
    Main,
    // All components in the system.
    System,
}

/**
 * Emitted by [[CComponentProvider]] if the active component changes.
 * @event
 */
export interface IActiveComponentEvent<T extends Component = Component> extends ITypedEvent<"active-component">
{
    previous: T;
    next: T;
}

/**
 * Emitted by [[CComponentProvider]] if the set of scoped components changes.
 * @event
 */
export interface IScopedComponentsEvent extends ITypedEvent<"scoped-components">
{
}

/**
 * Defines a scope of components. Exactly one component can be the active component. The scope
 * of candidate components is definable. The active component can be driven by the current selection.
 *
 * ### Events
 * - *"active-component"* - Emits [[IActiveComponentEvent]] if the active component changes.
 */
export default class CComponentProvider<T extends Component = Component> extends Component
{
    static readonly typeName: string = "CComponentProvider";

    static readonly componentType: ComponentOrType = Component as any;
    static readonly followComponentSelection = true;
    static readonly followNodeSelection = false;
    static readonly retainSelection = true;

    private _scope: EComponentScope = EComponentScope.Node;
    private _scopedNode: Node = null;
    private _scopedGraph: CGraph = null;
    private _activeComponent: T = null;

    get componentType() {
        return (this.constructor as typeof CComponentProvider).componentType;
    }
    /** If a component in scope is selected, it becomes the active component. */
    get followComponentSelection() {
        return (this.constructor as typeof CComponentProvider).followComponentSelection;
    }
    /** If a node is selected containing a component in scope, the component becomes the active component. */
    get followNodeSelection() {
        return (this.constructor as typeof CComponentProvider).followNodeSelection;
    }
    /** If the active component is unselected, keep it active anyway. */
    get retainSelection() {
        return (this.constructor as typeof CComponentProvider).retainSelection;
    }

    get scope() {
        return this._scope;
    }
    set scope(scope: EComponentScope) {
        this._scope = scope;
        if (this._activeComponent && !this.isComponentInScope(this._activeComponent)) {
            this.activeComponent = null;
        }
    }

    get scopedNode() {
        return this._scopedNode;
    }
    set scopedNode(node: Node) {
        if (node !== this._scopedNode) {
            this._scopedNode = node;

            if (this._activeComponent && !this.isComponentInScope(this._activeComponent)) {
                this.activeComponent = null;
            }

            this.onScopedComponents();
            this.emit<IScopedComponentsEvent>({ type: "scoped-components" });
        }
    }

    get scopedGraph() {
        return this._scopedGraph;
    }
    set scopedGraph(graphComponent: CGraph) {
        if (graphComponent !== this._scopedGraph) {
            this._scopedGraph = graphComponent;

            if (this._activeComponent && !this.isComponentInScope(this._activeComponent)) {
                this.activeComponent = null;
            }

            this.onScopedComponents();
            this.emit<IScopedComponentsEvent>({ type: "scoped-components" });
        }
    }

    get scopedComponents() {
        switch (this._scope) {
            case EComponentScope.Node:
                const node = this._scopedNode || this.node;
                return node.getComponents(this.componentType) as T[];
            case EComponentScope.Graph:
                const graph = this._scopedGraph ? this._scopedGraph.innerGraph : this.graph;
                return graph.getComponents(this.componentType) as T[];
            case EComponentScope.Main:
                return this.getMainComponents(this.componentType) as T[];
            case EComponentScope.System:
                return this.getSystemComponents(this.componentType) as T[];
        }
    }

    get activeComponent() {
        return this._activeComponent;
    }
    set activeComponent(component: T) {
        const activeComponent = this.activeComponent;

        if (component !== activeComponent) {
            if (activeComponent) {
                this.deactivateComponent(activeComponent);
            }
            if (component) {
                if (!this.isComponentInScope(component)) {
                    throw new Error("can't activate, component out of scope");
                }

                this.activateComponent(component);
            }

            this._activeComponent = component;
            this.onActiveComponent(activeComponent, component);
            this.emit<IActiveComponentEvent>({ type: "active-component", previous: activeComponent, next: component });
        }
    }

    protected get selection() {
        return this.getSystemComponent(CSelection);
    }

    create()
    {
        super.create();

        this.system.components.on(Component, this.onComponent, this);

        if (this.followComponentSelection) {
            this.selection.selectedComponents.on(this.componentType, this.onSelectComponent, this);
        }
        if (this.followNodeSelection) {
            this.selection.selectedNodes.on(Node, this.onSelectNode, this);
        }
    }

    dispose()
    {
        if (this.activeComponent) {
            this.activeComponent = null;
        }

        this.system.components.off(Component, this.onComponent, this);

        if (this.followComponentSelection) {
            this.selection.selectedComponents.off(this.componentType, this.onSelectComponent, this);
        }
        if (this.followNodeSelection) {
            this.selection.selectedNodes.off(Node, this.onSelectNode, this);
        }

        super.dispose();
    }

    protected activateComponent(component: T)
    {
    }

    protected deactivateComponent(component: T)
    {
    }

    protected onActiveComponent(previous: T, next: T)
    {
    }

    protected onScopedComponents()
    {
    }

    protected onComponent(event: IComponentEvent)
    {
        // in case the active component is removed
        if (event.remove && event.object === this.activeComponent) {
            this.activeComponent = null;
        }

        if (this.isComponentInScope(event.object)) {
            this.onScopedComponents();
            this.emit<IScopedComponentsEvent>({ type: "scoped-components" });
        }
    }

    protected onSelectComponent(event: IComponentEvent<T>)
    {
        const component = event.object;

        if (this.isComponentInScope(component)) {
            if (event.add) {
                this.activeComponent = component;
            }
            else if (event.remove && !this.retainSelection && component === this.activeComponent) {
                this.activeComponent = null;
            }
        }
    }

    protected onSelectNode(event: INodeEvent)
    {
        const node = event.object;

        if (this.isNodeInScope(node)) {
            const component = node.getComponent(this.componentType);
            if (component) {
                this.onSelectComponent({
                    type: component.typeName, object: component as T, add: event.add, remove: event.remove
                });
            }
        }
    }

    protected isComponentInScope(component: Component)
    {
        if (!component.is(this.componentType)) {
            return false;
        }

        switch (this._scope) {
            case EComponentScope.Node:
                const node = this._scopedNode || this.node;
                return component.node === node;
            case EComponentScope.Graph:
                const graph = this._scopedGraph ? this._scopedGraph.innerGraph : this.graph;
                return component.graph === graph;
            case EComponentScope.Main:
                return component.graph === this.system.graph;
            case EComponentScope.System:
                return true;
        }

        return false;
    }

    protected isNodeInScope(node: Node)
    {
        switch (this._scope) {
            case EComponentScope.Node:
                const scopedNode = this._scopedNode || this.node;
                return node === scopedNode;
            case EComponentScope.Graph:
                const graph = this._scopedGraph ? this._scopedGraph.innerGraph : this.graph;
                return node.graph === graph;
            case EComponentScope.Main:
                return node.graph === this.system.graph;
            case EComponentScope.System:
                return true;
        }
    }
}
