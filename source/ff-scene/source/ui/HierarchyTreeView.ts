/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import uniqueId from "@ff/core/uniqueId";

import System from "@ff/graph/System";
import Graph from "@ff/graph/Graph";
import Node from "@ff/graph/Node";
import Component from "@ff/graph/Component";

import CGraph from "@ff/graph/components/CGraph";
import CHierarchy, { IHierarchyEvent } from "@ff/graph/components/CHierarchy";
import CSelection, { INodeEvent, IComponentEvent, IActiveGraphEvent } from "@ff/graph/components/CSelection";

import "@ff/ui/Button";
import Tree from "@ff/ui/Tree";

import SelectionView, { customElement, html, property } from "./SelectionView";

////////////////////////////////////////////////////////////////////////////////

@customElement("ff-hierarchy-tree-view")
export default class HierarchyTreeView extends SelectionView
{
    protected tree: HierarchyTree = null;

    constructor(system?: System)
    {
        super(system);

        this.addEventListener("click", this.onClick.bind(this));
        this.addEventListener("contextmenu", this.onContextMenu.bind(this));
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("ff-hierarchy-tree-view");
        this.tree = new HierarchyTree(this.system);
    }

    protected connected()
    {
        super.connected();
        this.selection.selectedComponents.on(CGraph, this.onSelectGraph, this);
        this.selection.on<IActiveGraphEvent>("active-graph", this.onActiveGraph, this);
    }

    protected disconnected()
    {
        super.disconnected();
        this.selection.selectedComponents.off(CGraph, this.onSelectGraph, this);
        this.selection.off<IActiveGraphEvent>("active-graph", this.onActiveGraph, this);
    }

    protected render()
    {
        const selection = this.selection;
        const activeGraphComponent = selection.activeGraph && selection.activeGraph.parent;
        const text = activeGraphComponent ? activeGraphComponent.displayName : "Main";

        const down = selection.hasChildGraph() ? html`<ff-button icon="down" @click=${this.onClickDown}></ff-button>` : null;
        const up = selection.hasParentGraph() ? html`<ff-button icon="up" @click=${this.onClickUp}></ff-button>` : null;

        return html`<div class="ff-flex-row ff-header">${up}<div class="ff-text">${text}</div>${down}</div>
            <div class="ff-flex-item-stretch"><div class="ff-scroll-y">${this.tree}</div></div>`;
    }

    protected onClick()
    {
        this.selection.clearSelection();
    }

    protected onClickUp(event: MouseEvent)
    {
        event.stopPropagation();
        this.selection.activateParentGraph();
    }

    protected onClickDown(event: MouseEvent)
    {
        event.stopPropagation();
        this.selection.activateChildGraph();
    }

    protected onContextMenu()
    {

    }

    protected onSelectGraph(event: IComponentEvent)
    {
        this.requestUpdate();
    }

    protected onActiveGraph(event: IActiveGraphEvent)
    {
        this.requestUpdate();
    }
}

////////////////////////////////////////////////////////////////////////////////

type NCG = Node | Component | Graph;

@customElement("ff-hierarchy-tree")
export class HierarchyTree extends Tree<NCG>
{
    @property({ attribute: false })
    system: System;

    protected selection: CSelection = null;
    protected rootId = uniqueId();


    constructor(system?: System)
    {
        super();
        this.system = system;
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("ff-hierarchy-tree");

        this.selection = this.system.getComponent(CSelection, true);
        this.root = this.selection.activeGraph;
    }

    protected connected()
    {
        super.connected();

        const selection = this.selection;

        selection.selectedNodes.on(Node, this.onSelectNode, this);
        selection.selectedComponents.on(Component, this.onSelectComponent, this);
        selection.on("active-graph", this.onActiveGraph, this);

        selection.system.nodes.on(Node, this.onUpdate, this);
        selection.system.components.on(Component, this.onUpdate, this);
        selection.system.on<IHierarchyEvent>("hierarchy", this.onUpdate, this);
    }

    protected disconnected()
    {
        super.disconnected();

        const selection = this.selection;

        selection.selectedNodes.off(Node, this.onSelectNode, this);
        selection.selectedComponents.off(Component, this.onSelectComponent, this);
        selection.off("active-graph", this.onActiveGraph, this);

        selection.system.nodes.off(Node, this.onUpdate, this);
        selection.system.components.off(Component, this.onUpdate, this);
        selection.system.off<IHierarchyEvent>("hierarchy", this.onUpdate, this);
    }

    protected renderNodeHeader(item: NCG)
    {
        if (item instanceof Component || item instanceof Node) {
            if (item instanceof CGraph) {
                return html`<div class="ff-text ff-ellipsis"><b>${item.displayName}</b></div>`;
            }

            return html`<div class="ff-text ff-ellipsis">${item.displayName}</div>`;
        }
        else {
            const text = item.parent ? item.parent.displayName : "Main";
            return html`<div class="ff-text">${text}</div>`;
        }
    }

    protected isNodeSelected(treeNode: NCG)
    {
        const selection = this.selection;
        if (treeNode instanceof Component) {
            return selection.selectedComponents.contains(treeNode);
        }
        else if (treeNode instanceof Node) {
            return selection.selectedNodes.contains(treeNode);
        }
        return false;
    }

    protected getId(node: NCG)
    {
        return (node as any).id || this.rootId;
    }

    protected getClasses(node: NCG)
    {
        if (node instanceof Node) {
            return "ff-node";
        }
        if (node instanceof Component) {
            return "ff-component";
        }

        return "ff-system";
    }

    protected getChildren(node: NCG)
    {
        if (node instanceof Node) {
            let children: any = node.components.getArray();

            const hierarchy = node.components.get(CHierarchy, true);
            if (hierarchy) {
                children = children.concat(hierarchy.children.map(child => child.node));
            }
            return children;
        }
        if (node instanceof Graph) {
            return node.findRootNodes();
        }

        return null;
    }

    protected onNodeClick(event: MouseEvent, node: NCG)
    {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

        if (event.clientX - rect.left < 30) {
            this.toggleExpanded(node);
        }
        else if (node instanceof Node) {
            this.selection.selectNode(node, event.ctrlKey);
        }
        else if (node instanceof Component) {
            this.selection.selectComponent(node, event.ctrlKey);
        }
    }

    protected onNodeDblClick(event: MouseEvent, treeNode: NCG)
    {
        if (treeNode instanceof CGraph) {
            this.selection.activeGraph = treeNode.innerGraph;
        }
    }

    protected onSelectNode(event: INodeEvent)
    {
        this.setSelected(event.object, event.add);
    }

    protected onSelectComponent(event: IComponentEvent)
    {
        this.setSelected(event.object, event.add);
    }

    protected onActiveGraph(event: IActiveGraphEvent)
    {
        this.root = this.selection.activeGraph;
    }
}