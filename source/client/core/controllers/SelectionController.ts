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

import { Dictionary, Readonly } from "@ff/core/types";
import { IPublisherEvent } from "@ff/core/Publisher";
import Controller, { Actions } from "@ff/core/Controller";
import Commander from "@ff/core/Commander";

import System, { ISystemComponentEvent, ISystemEntityEvent } from "@ff/core/ecs/System";
import Component from "@ff/core/ecs/Component";
import Entity from "@ff/core/ecs/Entity";

////////////////////////////////////////////////////////////////////////////////

export interface ISelectComponentEvent extends IPublisherEvent<SelectionController>
{
    selected: boolean;
    component: Component;
    selectedComponents: Readonly<Component[]>;
}

export interface ISelectEntityEvent extends IPublisherEvent<SelectionController>
{
    selected: boolean;
    entity: Entity;
    selectedEntities: Readonly<Entity[]>
}

export type SelectionActions = Actions<SelectionController>;

type ECS = Component | Entity | System;

export default class SelectionController extends Controller<SelectionController>
{
    readonly system: System;

    protected selectedComponents: Component[] = [];
    protected selectedEntities: Entity[] = [];

    protected selectedIds: Dictionary<boolean> = {};
    protected expandedIds: Dictionary<boolean> = {};

    protected changed = false;


    constructor(commander: Commander, system: System)
    {
        super(commander);
        this.addEvents("change", "component", "entity");

        this.system = system;
        system.on("component", this.onComponent, this);
        system.on("entity", this.onEntity, this);
    }

    dispose()
    {
        this.system.off("component", this.onComponent, this);
        this.system.off("entity", this.onEntity, this);
    }

    get selected(): Readonly<Dictionary<boolean>>
    {
        return this.selectedIds;
    }

    get expanded(): Readonly<Dictionary<boolean>>
    {
        return this.expandedIds;
    }

    expandAll()
    {
        this.system.getEntities().forEach(entity => this.expandedIds[entity.id] = true);
        this.system.getComponents().forEach(component => this.expandedIds[component.id] = true);

        this.emit("change");
    }

    toggleExpanded(item: ECS)
    {
        if (item instanceof System) {
            return;
        }

        this.expandedIds[item.id] = !this.expandedIds[item.id];
        this.emit("change");
    }

    createActions(commander: Commander)
    {
        return {
            select: commander.register({
                name: "Select", do: this.select, target: this
            })
        };
    }

    protected select(item: ECS, multi: boolean)
    {
        if (item instanceof System) {
            return;
        }

        const id = item ? item.id : "";

        if (multi && id) {
            const selected = this.selectedIds[id] = !this.selectedIds[id];
            this.emitSelect(id, selected);
        }
        else if (!multi && (!id || !this.selectedIds[id])) {
            Object.keys(this.selectedIds).forEach(id => this.emitSelect(id, false));
            this.selectedIds = {};

            if (id) {
                this.selectedIds[id] = true;
                this.emitSelect(id, true);
            }
        }

        this.emit("change");
    }

    protected emitSelect(id: string, selected: boolean)
    {
        const entity = this.system.getEntityById(id);
        if (entity) {
            const selectedEntities = this.selectedEntities;

            if (selected) {
                selectedEntities.push(entity);
            }
            else {
                const index = this.selectedEntities.indexOf(entity);
                selectedEntities.splice(index, 1);
            }

            this.emit<ISelectEntityEvent>("entity", { entity, selectedEntities, selected });
            return;
        }

        const component = this.system.getComponentById(id);
        if (component) {
            const selectedComponents = this.selectedComponents;

            if (selected) {
                selectedComponents.push(component);
            }
            else {
                const index = this.selectedComponents.indexOf(component);
                selectedComponents.splice(index, 1);
            }

            this.emit<ISelectComponentEvent>("component", { component, selectedComponents, selected });
        }
    }

    protected emitChange()
    {
        if (!this.changed) {
            this.changed = true;
            setTimeout(() => {
                this.changed = false;
                this.emit("change");
            });
        }
    }

    protected onComponent(event: ISystemComponentEvent)
    {
        this.expandedIds[event.component.id] = true;
        this.emitChange();
    }

    protected onEntity(event: ISystemEntityEvent)
    {
        this.expandedIds[event.entity.id] = true;
        this.emitChange();
    }
}