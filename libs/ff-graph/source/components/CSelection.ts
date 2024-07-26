/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { ITypedEvent } from "@ff/core/Publisher";
import Commander from "@ff/core/Commander";
import ObjectRegistry from "@ff/core/ObjectRegistry";

import { types } from "../propertyTypes";

import Component, { ComponentOrType, IComponentEvent } from "../Component";
import Node, { INodeEvent, NodeOrType } from "../Node";
import Graph from "../Graph";

import CGraph from "./CGraph";
import CController, { Actions } from "./CController";

////////////////////////////////////////////////////////////////////////////////

export { INodeEvent, IComponentEvent };

export interface IActiveGraphEvent extends ITypedEvent<"active-graph">
{
    previous: Graph;
    next: Graph;
}

export type SelectionActions = Actions<CSelection>;

/**
 * Manages selection state for nodes and components.
 * Use [[CSelection.exclusiveSelect]] to decide whether node and component selection is mutually exclusive.
 * A selection always encompasses only items in one graph, the *active graph*. When the active graph changes,
 * an [[IActiveGraphEvent]] is fired.
 *
 * ### Events
 * - *"active-graph"* - emits an [[IActiveGraphEvent]] after the active graph has changed.
 * - *<ComponentType>* - [[CSelection.selectedComponents]] emits an [[IComponentEvent]] if a component is selected/unselected.
 * - *<NodeType>* - [[CSelection.selectedNodes]] emits an [[INodeEvent]] if a node is selected/unselected.
 */
export default class CSelection extends CController<CSelection>
{
    static readonly typeName: string = "CSelection";

    protected static readonly selOuts = {
        selNodeCount: types.Integer("Selection.Nodes"),
        selComponentCount: types.Integer("Selection.Components")
    };

    outs = this.addOutputs(CSelection.selOuts);

    multiSelect = false;
    exclusiveSelect = true;

    readonly selectedNodes = new ObjectRegistry(Node);
    readonly selectedComponents = new ObjectRegistry(Component);

    getSelectedNode<T extends Node = Node>(nodeOrClass?: NodeOrType<T>) {
        return this.selectedNodes.get(nodeOrClass, true);
    }
    getSelectedNodes<T extends Node = Node>(nodeOrClass?: NodeOrType<T>) {
        return this.selectedNodes.getArray(nodeOrClass);
    }

    getSelectedComponent<T extends Component = Component>(componentOrClass?: ComponentOrType<T>) {
        return this.selectedComponents.get(componentOrClass, true);
    }
    getSelectedComponents<T extends Component = Component>(componentOrClass?: ComponentOrType<T>) {
        return this.selectedComponents.getArray(componentOrClass);
    }

    private _activeGraph: Graph = null;

    constructor(node: Node, id: string)
    {
        super(node, id);
        this.addEvents("select-node", "select-component", "active-graph", "update");

        this.selectedNodes.on(Node, e => this.onSelectNode(e.object, e.add));
        this.selectedComponents.on(Component, e => this.onSelectComponent(e.object, e.add));

        this._activeGraph = this.system.graph;
    }

    get activeGraph() {
        return this._activeGraph;
    }
    set activeGraph(graph: Graph) {
        if (graph !== this.activeGraph) {
            this.clearSelection();
            const previous = this._activeGraph;
            this._activeGraph = graph;
            this.onActiveGraph(graph);
            this.emit<IActiveGraphEvent>({ type: "active-graph", previous, next: graph });
        }
    }

    hasParentGraph()
    {
        return this._activeGraph && this._activeGraph.parent;
    }

    activateParentGraph()
    {
        if (this._activeGraph && this._activeGraph.parent.graph) {
            this.activeGraph = this._activeGraph.parent.graph;
        }
    }

    hasChildGraph()
    {
        return this.selectedComponents.has(CGraph);
    }

    activateChildGraph()
    {
        const graphComponent = this.selectedComponents.get(CGraph, true);
        if (graphComponent) {
            this.activeGraph = graphComponent.innerGraph;
        }
    }

    create()
    {
        super.create();

        this.system.nodes.on(Node, this.onSystemNode, this);
        this.system.components.on(Component, this.onSystemComponent, this);
    }

    dispose()
    {
        this.system.nodes.off(Node, this.onSystemNode, this);
        this.system.components.off(Component, this.onSystemComponent, this);

        super.dispose();
    }

    createActions(commander: Commander)
    {
        return {
            selectNode: commander.register({
                name: "Select Node", do: this.selectNode, target: this
            }),
            selectComponent: commander.register({
                name: "Select Component", do: this.selectComponent, target: this
            }),
            clearSelection: commander.register({
                name: "Clear Selection", do: this.clearSelection, target: this
            })
        };
    }

    nodeContainsSelectedComponent(node: Node)
    {
        const components = node.components.getArray();
        for (let i = 0, n = components.length; i < n; ++i) {
            if (this.selectedComponents.contains(components[i])) {
                return true;
            }
        }

        return false;
    }

    selectNode(node?: Node, toggle: boolean = false)
    {
        this.activeGraph = node.graph;

        const selectedNodes = this.selectedNodes;
        const multiSelect = this.multiSelect && toggle;

        if (node && selectedNodes.contains(node)) {
            if (multiSelect) {
                selectedNodes.remove(node);
            }
        }
        else {
            if (this.exclusiveSelect) {
                this.selectedComponents.clear();
            }
            if (!multiSelect) {
                selectedNodes.clear();
            }
            if (node) {
                selectedNodes.add(node);
            }
        }

        this.updateStats();
    }

    selectComponent(component?: Component, toggle: boolean = false)
    {
        this.activeGraph = component.graph;

        const selectedComponents = this.selectedComponents;
        const multiSelect = this.multiSelect && toggle;

        if (component && selectedComponents.contains(component)) {
            if (multiSelect) {
                selectedComponents.remove(component);
            }
        }
        else {
            if (this.exclusiveSelect) {
                this.selectedNodes.clear();
            }
            if (!multiSelect) {
                selectedComponents.clear();
            }
            if (component) {
                selectedComponents.add(component);
            }
        }

        this.updateStats();
    }

    clearSelection()
    {
        this.selectedNodes.clear();
        this.selectedComponents.clear();

        this.updateStats();
    }

    protected onSelectNode(node: Node, selected: boolean)
    {
    }

    protected onSelectComponent(component: Component, selected: boolean)
    {
    }

    protected onActiveGraph(graph: Graph)
    {
    }

    protected onSystemNode(event: INodeEvent)
    {
        if (event.remove && this.selectedNodes.contains(event.object)) {
            this.selectedNodes.remove(event.object);
            this.updateStats();
        }
    }

    protected onSystemComponent(event: IComponentEvent)
    {
        if (event.remove && this.selectedComponents.contains(event.object)) {
            this.selectedComponents.remove(event.object);
            this.updateStats();
        }
    }

    protected updateStats()
    {
        const outs = this.outs;
        outs.selNodeCount.setValue(this.selectedNodes.length);
        outs.selComponentCount.setValue(this.selectedComponents.length);
    }
}