/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Node, { NodeOrType } from "../Node";
import CHierarchy from "../components/CHierarchy";

////////////////////////////////////////////////////////////////////////////////

const _EMPTY_ARRAY = [];

const _getChildNode = <T extends Node>(node: Node, nodeOrType: NodeOrType<T>, recursive: boolean): T | null => {

    const children = node.components.get(CHierarchy).children;
    for (let i = 0, n = children.length; i < n; ++i) {
        const childNode = children[i].node;

        if (childNode.is(nodeOrType)) {
            return childNode as T;
        }
    }

    if (recursive) {
        for (let i = 0, n = children.length; i < n; ++i) {
            const descendant = _getChildNode(children[i].node, nodeOrType, true);
            if (descendant) {
                return descendant as T;
            }
        }
    }

    return null;
};

const _getChildNodes = <T extends Node>(node: Node, nodeOrType: NodeOrType<T>, recursive: boolean): T[] => {

    const children = node.components.get(CHierarchy).children;
    let result = [];

    for (let i = 0, n = children.length; i < n; ++i) {
        const childNode = children[i].node;

        if (childNode.is(nodeOrType)) {
            result.push(childNode);
        }
    }

    if (recursive) {
        for (let i = 0, n = children.length; i < n; ++i) {
            result = result.concat(_getChildNodes(children[i].node, nodeOrType, true));
        }
    }

    return result;
};


const _findChildNode = (node: Node, name: string, recursive: boolean): Node | null => {

    const children = node.components.get(CHierarchy).children;
    for (let i = 0, n = children.length; i < n; ++i) {
        const childNode = children[i].node;

        if (childNode.name === name) {
            return childNode;
        }
    }

    if (recursive) {
        for (let i = 0, n = children.length; i < n; ++i) {
            const descendant = _findChildNode(children[i].node, name, true);
            if (descendant) {
                return descendant;
            }
        }
    }

    return null;
};

////////////////////////////////////////////////////////////////////////////////


export default class NHierarchy extends Node
{
    static readonly typeName: string = "NHierarchy";

    get hierarchy() {
        return this.components.get(CHierarchy);
    }

    createComponents()
    {
        this.createComponent(CHierarchy);
    }

    addChild(node: NHierarchy)
    {
        this.hierarchy.addChild(node.hierarchy);
    }

    removeChild(node: NHierarchy)
    {
        this.hierarchy.removeChild(node.hierarchy);
    }

    getRoot(): Node
    {
        let node = this as Node;
        let hierarchy = this.hierarchy;

        while(hierarchy) {
            node = hierarchy.node;
            hierarchy = hierarchy.parent;
        }

        return node;
    }

    getParent<T extends Node>(nodeOrType: NodeOrType<T>, recursive: boolean): T | null
    {
        let hierarchy = this.hierarchy;
        let parent = hierarchy ? hierarchy.parent : null;

        if (!parent) {
            return null;
        }

        if (parent.node.is(nodeOrType)) {
            return parent.node as T;
        }

        if (recursive) {
            parent = parent.parent;
            while(parent) {
                if (parent.node.is(nodeOrType)) {
                    return parent.node as T;
                }
            }
        }

        return null;
    }

    /**
     * Returns the child node with the given name.
     * @param name
     * @param recursive If true, extends search to entire subtree (breadth-first).
     */
    findChild(name: string, recursive: boolean): Node | null
    {
        return this.hierarchy ? _findChildNode(this, name, recursive) : null;
    }

    /**
     * Returns the child node of the given type.
     * @param nodeOrType
     * @param recursive If true, extends search to entire subtree (breadth-first).
     */
    getChild<T extends Node>(nodeOrType: NodeOrType<T>, recursive: boolean): T | null
    {
        return this.hierarchy ? _getChildNode(this, nodeOrType, recursive) : null;
    }

    /**
     * Returns all child nodes of the given type.
     * @param nodeOrType
     * @param recursive If true, extends search to entire subtree (breadth-first).
     */
    getChildren<T extends Node>(nodeOrType: NodeOrType<T>, recursive: boolean): Readonly<T[]>
    {
        return this.hierarchy ? _getChildNodes(this, nodeOrType, recursive) : _EMPTY_ARRAY;
    }

    /**
     * Returns true if there is a child node of the given type.
     * @param nodeOrType
     * @param recursive If true, extends search to entire subtree (breadth-first).
     */
    hasChildren<T extends Node>(nodeOrType: NodeOrType<T>, recursive: boolean): boolean
    {
        return this.hierarchy ? !!_getChildNode(this, nodeOrType, recursive) : false;
    }
}