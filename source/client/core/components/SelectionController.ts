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

import { Dictionary } from "@ff/core/types";
import Commander from "@ff/core/Commander";

import System, { ISystemEntityEvent, ISystemComponentEvent } from "@ff/core/ecs/System";
import Entity from "@ff/core/ecs/Entity";
import Component, { IComponentChangeEvent } from "@ff/core/ecs/Component";

import PickManip, { IPickManipPickEvent } from "./PickManip";
import Controller, { Actions } from "./Controller";
import { IPublisherEvent } from "@ff/core/Publisher";

////////////////////////////////////////////////////////////////////////////////

export interface ISelectComponentEvent extends IPublisherEvent<SelectionController>
{
    selected: boolean;
    component: Component;
}

export interface ISelectEntityEvent extends IPublisherEvent<SelectionController>
{
    selected: boolean;
    entity: Entity;
}

export type SelectionActions = Actions<SelectionController>;

type ECS = Component | Entity | System;

export default class SelectionController extends Controller<SelectionController>
{
    static readonly type: string = "SelectionController";

    public actions: SelectionActions;
    public selected: Dictionary<ECS> = {};

    private startX: number = 0;
    private startY: number = 0;

    constructor(id?: string)
    {
        super(id);
        this.addEvents("select-component", "select-entity");
    }

    create()
    {
        super.create();

        this.trackComponent(PickManip,
            component => component.on("pick", this.onPick, this),
            component => component.off("pick", this.onPick, this));

        this.system.on("component", this.onComponent, this);
        this.system.on("entity", this.onEntity, this);
    }

    update()
    {
        this.emit<IComponentChangeEvent>("change", { what: "hierarchy" });
    }

    dispose()
    {
        this.system.off("component", this.onComponent, this);
        this.system.off("entity", this.onEntity, this);

        super.dispose();
    }

    createActions(commander: Commander)
    {
        const actions = {
            setSelected: commander.register({
                name: "Set Selected", do: this.setSelected, target: this
            }),
            clearSelection: commander.register({
                name: "Clear Selection", do: this.clearSelection, target: this
            })
        };

        this.actions = actions;
        return actions;
    }

    setSelected(item: ECS, selected: boolean)
    {
        if (item instanceof System) {
            return;
        }

        const id = item.id;
        if (!!this.selected[id] === selected) {
            return;
        }

        if (selected) {
            this.clearSelection();
            this.selected[item.id] = item;
        }
        else {
            delete this.selected[item.id];
        }

        this.emitSelect(item, selected);
        this.emit<IComponentChangeEvent>("change", { what: "selection" });
    }

    clearSelection()
    {
        Object.keys(this.selected).forEach(key => this.emitSelect(this.selected[key], false));

        this.selected = {};
        this.emit<IComponentChangeEvent>("change", { what: "selection" });
    }

    protected emitSelect(item: ECS, selected: boolean)
    {
        if (item instanceof System) {
            return;
        }

        if (item instanceof Component) {
            this.emit<ISelectComponentEvent>("select-component", { selected, component: item });
        }
        else {
            this.emit<ISelectEntityEvent>("select-entity", { selected, entity: item });
        }
    }

    protected onPick(event: IPickManipPickEvent)
    {
        const pointerEvent = event.pointerEvent;

        if (pointerEvent.type === "down") {
            this.startX = pointerEvent.centerX;
            this.startY = pointerEvent.centerY;
        }
        else if (pointerEvent.type === "up") {
            const dx = pointerEvent.centerX - this.startX;
            const dy = pointerEvent.centerY - this.startY;

            if (Math.abs(dx) + Math.abs(dy) < 3) {
                if (event.component) {
                    this.actions.setSelected(event.component, true);
                }
                else {
                    this.actions.clearSelection();
                }
            }
        }
    }

    protected onEntity(event: ISystemEntityEvent)
    {
        this.changed = true;
    }

    protected onComponent(event: ISystemComponentEvent)
    {
        this.changed = true;
    }
}