/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Component, { types, ComponentOrType, IUpdateContext } from "../Component";
import Graph from "../Graph";

import CHierarchy from "./CHierarchy";
import Node, { NodeOrType } from "../Node";

////////////////////////////////////////////////////////////////////////////////

export { Node, types };

export default class CGraph extends Component
{
    static readonly typeName: string = "CGraph";

    protected static readonly graphIns = {
        active: types.Boolean("Graph.Active", true),
    };

    ins = this.addInputs(CGraph.graphIns);

    protected _innerGraph: Graph = null;
    protected _innerRoot: CHierarchy = null;

    constructor(node: Node, id: string)
    {
        super(node, id);
        this._innerGraph = new Graph(this.system, this);
    }

    get innerGraph() {
        return this._innerGraph;
    }
    get innerNodes() {
        return this._innerGraph.nodes;
    }
    get innerComponents() {
        return this._innerGraph.components;
    }
    get innerRoots() {
        return this._innerGraph.roots;
    }

    getInnerComponent<T extends Component = Component>(componentOrClass?: ComponentOrType<T>, nothrow: boolean = false) {
        return this._innerGraph.components.get(componentOrClass, nothrow);
    }

    getInnerComponents<T extends Component = Component>(componentOrClass?: ComponentOrType<T>) {
        return this._innerGraph.components.getArray(componentOrClass);
    }

    hasInnerComponent(componentOrClass: ComponentOrType) {
        return this._innerGraph.components.has(componentOrClass);
    }

    getInnerNode<T extends Node = Node>(nodeOrClass?: NodeOrType<T>, nothrow: boolean = false) {
        return this._innerGraph.nodes.get(nodeOrClass, nothrow);
    }

    getInnerNodes<T extends Node = Node>(nodeOrClass?: NodeOrType<T>) {
        return this._innerGraph.nodes.getArray(nodeOrClass);
    }

    hasInnerNode(nodeOrClass: NodeOrType) {
        return this._innerGraph.nodes.has(nodeOrClass);
    }

    isEmpty() {
        return this._innerGraph.nodes.count() === 0;
    }

    update(context: IUpdateContext)
    {
        const ins = this.ins;

        if (ins.active.changed) {
            const isActive = ins.active.value;
            const graph = this._innerGraph;

            if (isActive !== graph.isActive) {
                if (isActive) {
                    this.activateInnerGraph();
                }
                else {
                    this.deactivateInnerGraph();
                }
            }
        }

        // TODO: Evaluate interface ins/outs
        return true;
    }

    tick(context: IUpdateContext)
    {
        return this._innerGraph.tick(context);
    }

    tock(context: IUpdateContext)
    {
        return this._innerGraph.tock(context);
    }

    dispose()
    {
        this._innerGraph.clear();
        this._innerGraph = null;
        this._innerRoot = null;

        super.dispose();
    }

    /**
     * Removes all components and nodes from the inner graph.
     */
    clearInnerGraph()
    {
        this._innerGraph.clear();
    }

    fromJSON(json: any)
    {
        super.fromJSON(json);

        this._innerGraph.clear();
        this._innerGraph.fromJSON(json.graph);
    }

    toJSON()
    {
        const json = super.toJSON();

        json.graph = this._innerGraph.toJSON();
        return json;
    }

    dump(indent = "")
    {
        super.dump(indent);
        this.innerGraph.dump(indent + "  ");
    }

    onAddInnerRoot(component: CHierarchy)
    {
    }

    onRemoveInnerRoot(component: CHierarchy)
    {
    }

    protected activateInnerGraph()
    {
        this._innerGraph.activate();
    }

    protected deactivateInnerGraph()
    {
        this._innerGraph.deactivate();
    }
}

