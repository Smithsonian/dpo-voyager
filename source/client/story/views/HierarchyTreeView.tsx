/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from "react";
import { MouseEvent } from "react";

import Hierarchy from "@ff/core/ecs/Hierarchy";
import Component from "@ff/core/ecs/Component";
import Entity from "@ff/core/ecs/Entity";
import System from "@ff/core/ecs/System";

import Tree from "@ff/react/Tree";

import SelectionController from "../components/SelectionController";

////////////////////////////////////////////////////////////////////////////////

type ECS = Component | Entity | System;

const _getId = (node: ECS) => {
    if (node instanceof System) {
        return "system";
    }
    return node.id;
};

const _getClass = (node: ECS) => {
    if (node instanceof Component) {
        return "sv-component";
    }
    if (node instanceof Entity) {
        return "sv-entity";
    }
    return "sv-system";
};

const _getChildren = (node: ECS) => {
    if (node instanceof Hierarchy) {
        return node.children.map(comp => comp.entity);
    }
    if (node instanceof Entity) {
        return node.getComponents();
    }
    if (node instanceof System) {
        return node.getRootEntities();
    }
    return [];
};

/** Properties for [[HierarchyTreeView]] component. */
export interface IHierarchyTreeViewProps
{
    className?: string;
    controller: SelectionController
}

export default class HierarchyTreeView extends React.Component<IHierarchyTreeViewProps, {}>
{
    static readonly defaultProps = {
        className: "sv-hierarchy-tree-view"
    };

    componentDidMount()
    {
        this.props.controller.on("change", this.onChange, this);
    }

    componentWillUnmount()
    {
        this.props.controller.off("change", this.onChange, this);
    }

    render()
    {
        const controller = this.props.controller;

        const renderHeader = (node: ECS) => {
            let text;
            if (node instanceof Component) {
                text = node.type;
            }
            else if (node instanceof Entity) {
                text = node.name;
            }
            else {
                text = "System";
            }

            return (<div
                className="sv-header"
                onClick={(e) => this.onClickHeader(e, node)}>
                {text}
            </div>);
        };

        return (
            <Tree
                className={this.props.className}
                tree={controller.system}
                includeRoot={false}
                selected={controller.selected}
                expanded={controller.expanded}
                getId={_getId}
                getClass={_getClass}
                getChildren={_getChildren}
                renderHeader={renderHeader} />
        );
    }

    protected onChange()
    {
        this.forceUpdate();
    }

    protected onClickHeader(e: MouseEvent, node: ECS)
    {
        const controller = this.props.controller;
        const rect = (e.target as HTMLDivElement).getBoundingClientRect();
        const x = e.clientX - rect.left;

        if (x < 20) {
            controller.toggleExpanded(node);
        }
        else {
            controller.actions.select(node, e.ctrlKey);
        }
    }
}