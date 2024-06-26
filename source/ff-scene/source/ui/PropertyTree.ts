/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Property from "@ff/graph/Property";
import PropertyGroup from "@ff/graph/PropertyGroup";
import Component from "@ff/graph/Component";
import Node from "@ff/graph/Node";
import System from "@ff/graph/System";

import CSelection, { INodeEvent, IComponentEvent } from "@ff/graph/components/CSelection";

import Tree, { customElement, property, html } from "@ff/ui/Tree";

import "./PropertyView";

////////////////////////////////////////////////////////////////////////////////

interface ITreeNode
{
    id: string;
    children: ITreeNode[];
    text: string;
    classes: string;
    property?: Property;
}

@customElement("ff-property-tree")
export default class PropertyTree extends Tree<ITreeNode>
{
    @property({ attribute: false })
    system: System;

    protected selection: CSelection = null;


    constructor(system?: System)
    {
        super();
        this.includeRoot = true;

        this.system = system;
        this.selection = system.getComponent(CSelection, true);
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("ff-property-tree");
    }

    protected connected()
    {
        super.connected();

        const selection = this.selection;

        selection.selectedNodes.on(Node, this.onSelectNode, this);
        selection.selectedComponents.on(Component, this.onSelectComponent, this);

        const node = selection.getSelectedNode();
        if (node) {
            this.root = this.createNodeTreeNode(node);
        }
        else {
            const component = selection.getSelectedComponent();
            this.root = component ? this.createComponentTreeNode(component) : null;
        }
    }

    protected disconnected()
    {
        super.disconnected();

        this.selection.selectedNodes.off(Node, this.onSelectNode, this);
        this.selection.selectedComponents.off(Component, this.onSelectComponent, this);
    }

    protected getClasses(node: ITreeNode)
    {
        return node.classes;
    }

    protected renderNodeHeader(node: ITreeNode)
    {
        if (node.property) {
            return html`<div class="ff-text ff-property-label ff-ellipsis">${node.text}</div>
                <ff-property-view .property=${node.property}></ff-property-view>`;
        }

        return html`<div class="ff-text ff-label ff-ellipsis">${node.text}</div>`;
    }

    protected onSelectNode(event: INodeEvent)
    {
        if (event.add) {
            this.root = this.createNodeTreeNode(event.object);
        }
        else {
            this.root = null;
        }
    }

    protected onSelectComponent(event: IComponentEvent)
    {
        if (event.add) {
            this.root = this.createComponentTreeNode(event.object);
        }
        else {
            this.root = null;
        }
    }

    protected createNodeTreeNode(node: Node): ITreeNode
    {
        return {
            id: node.id,
            text: node.displayName,
            classes: "ff-node",
            children: node.components.getArray().map(component => this.createComponentTreeNode(component))
        };
    }

    protected createComponentTreeNode(component: Component): ITreeNode
    {
        const id = component.id;
        const inputsId = id + "i";
        const outputsId = id + "o";

        return {
            id,
            text: component.displayName,
            classes: "ff-component",
            property: null,
            children: [
                this.createGroupNode(inputsId, "Inputs", component.ins),
                this.createGroupNode(outputsId, "Outputs", component.outs)
            ]
        };
    }

    protected createGroupNode(id: string, text: string, group: PropertyGroup): ITreeNode
    {
        const properties = group.properties;
        const root: ITreeNode = {
            id,
            text,
            classes: group.isInputGroup() ? "ff-inputs" : "ff-outputs",
            children: []
        };

        properties.forEach(property => {
            const fragments = property.path.split(".");
            let node = root;

            const count = fragments.length;
            const last = count - 1;

            for (let i = 0; i < count; ++i) {
                const fragment = fragments[i];
                let child = node.children.find(node => node.text === fragment);

                if (!child) {
                    const id = i === last ? property.key : fragment;

                    child = {
                        id,
                        text: fragment,
                        classes: "",
                        children: [],
                        property: i === last ? property : null
                    };
                    node.children.push(child);
                }
                node = child;
            }
        });

        return root;
    }
}
