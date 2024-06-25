/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Component, { ITypedEvent, types } from "../Component";
import Node, { NodeOrType } from "../Node";

import CGraph from "./CGraph";
import CSelection, { INodeEvent, IComponentEvent } from "./CSelection";

////////////////////////////////////////////////////////////////////////////////

export enum ENodeScope {
    // Components in the given scoped graph.
    Graph,
    // Nodes in the main graph.
    Main,
    // All nodes in the system.
    System,
}

/**
 * Emitted by [[CNodeProvider]] if the active node changes.
 * @event
 */
export interface IActiveNodeEvent<T extends Node = Node> extends ITypedEvent<"active-node">
{
    previous: T;
    next: T;
}

/**
 * Emitted by [[CNodeProvider]] if the set of scoped nodes changes.
 * @event
 */
export interface IScopedNodesEvent extends ITypedEvent<"scoped-nodes">
{
}

/**
 * Defines a scope of nodes. Exactly one node can be the active node. The scope
 * of candidate nodes is definable. The active node can be driven by the current selection.
 *
 * ### Events
 * - *"active-node"* - Emits [[IActiveNodeEvent]] if the active node changes.
 */
export default class CNodeProvider<T extends Node = Node> extends Component
{
    static readonly typeName: string = "CNodeProvider";

    static readonly nodeType: NodeOrType = Node as any;
    static readonly followNodeSelection: boolean = true;
    static readonly followComponentSelection: boolean = false;
    static readonly retainSelection: boolean = true;

    private _scope: ENodeScope = ENodeScope.Graph;
    private _scopedGraph: CGraph = null;
    private _activeNode: T = null;

    get nodeType() {
        return (this.constructor as typeof CNodeProvider).nodeType;
    }
    /** If a node in scope is selected, it becomes the active node. */
    get followNodeSelection() {
        return (this.constructor as typeof CNodeProvider).followNodeSelection;
    }
    /** If a component is selected whose parent node is in scope, the node becomes the active node. */
    get followComponentSelection() {
        return (this.constructor as typeof CNodeProvider).followComponentSelection;
    }
    /** If the active node is unselected, keep it active anyway. */
    get retainSelection() {
        return (this.constructor as typeof CNodeProvider).retainSelection;
    }

    get scope() {
        return this._scope;
    }
    set scope(scope: ENodeScope) {
        this._scope = scope;
        if (this._activeNode && !this.isNodeInScope(this._activeNode)) {
            this.activeNode = null;
        }
    }
    
    get scopedGraph() {
        return this._scopedGraph;
    }
    set scopedGraph(graphComponent: CGraph) {
        if (graphComponent !== this._scopedGraph) {
            this._scopedGraph = graphComponent;

            if (this._activeNode && !this.isNodeInScope(this._activeNode)) {
                this.activeNode = null;
            }

            this.onScopedNodes();
            this.emit<IScopedNodesEvent>({ type: "scoped-nodes" });
        }
    }

    get scopedNodes() {
        switch (this._scope) {
            case ENodeScope.Graph:
                const graph = this._scopedGraph ? this._scopedGraph.innerGraph : this.graph;
                return graph.getNodes(this.nodeType) as T[];
            case ENodeScope.Main:
                return this.getMainNodes(this.nodeType) as T[];
            case ENodeScope.System:
                return this.getSystemNodes(this.nodeType) as T[];
        }
    }
    get activeNode() {
        return this._activeNode;
    }
    set activeNode(node: T) {
        const activeNode = this.activeNode;

        if (node !== activeNode) {
            if (activeNode) {
                this.deactivateNode(activeNode);
            }
            if (node) {
                if (!this.isNodeInScope(node)) {
                    throw new Error("can't activate, node out of scope");
                }

                this.activateNode(node);
            }

            this._activeNode = node;
            this.onActiveNode(activeNode, node);
            this.emit<IActiveNodeEvent>({ type: "active-node", previous: activeNode, next: node });
        }
    }

    protected get selection() {
        return this.getSystemComponent(CSelection);
    }

    create()
    {
        super.create();

        this.system.nodes.on(Node, this.onNode, this);

        if (this.followNodeSelection) {
            this.selection.selectedNodes.on(this.nodeType, this.onSelectNode, this);
        }
        if (this.followComponentSelection) {
            this.selection.selectedComponents.on(Component, this.onSelectComponent, this);
        }
    }

    dispose()
    {
        if (this.activeNode) {
            this.activeNode = null;
        }

        this.system.nodes.off(Node, this.onNode, this);

        if (this.followNodeSelection) {
            this.selection.selectedNodes.off(this.nodeType, this.onSelectNode, this);
        }
        if (this.followComponentSelection) {
            this.selection.selectedComponents.off(Component, this.onSelectComponent, this);
        }

        super.dispose();
    }

    protected activateNode(node: T)
    {
    }

    protected deactivateNode(node: T)
    {
    }

    protected onActiveNode(previous: T, next: T)
    {
    }

    protected onScopedNodes()
    {
    }

    protected onNode(event: INodeEvent)
    {
        // in case the active node is removed
        if (event.remove && event.object === this.activeNode) {
            this.activeNode = null;
        }

        if (this.isNodeInScope(event.object)) {
            this.onScopedNodes();
            this.emit<IScopedNodesEvent>({ type: "scoped-nodes" });
        }
    }

    protected onSelectNode(event: INodeEvent<T>)
    {
        const node = event.object;

        if (this.isNodeInScope(node)) {
            if (event.add) {
                this.activeNode = node;
            }
            else if (event.remove && !this.retainSelection && node === this.activeNode) {
                this.activeNode = null;
            }
        }
    }

    protected onSelectComponent(event: IComponentEvent)
    {
        const node = event.object.node;
        if (node.is(this.nodeType)) {
            this.onSelectNode({
                type: node.typeName, object: node as T, add: event.add, remove: event.remove
            });
        }
    }

    protected isNodeInScope(node: Node)
    {
        if (!node.is(this.nodeType)) {
            return false;
        }

        switch (this._scope) {
            case ENodeScope.Graph:
                const graph = this._scopedGraph ? this._scopedGraph.innerGraph : this.graph;
                return node.graph === graph;
            case ENodeScope.Main:
                return node.graph === this.system.graph;
            case ENodeScope.System:
                return true;
        }

        return false;
    }
}