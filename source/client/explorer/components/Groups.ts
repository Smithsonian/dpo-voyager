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
import { IComponentChangeEvent } from "@ff/graph/Component";

import { IGroup as IGroupData } from "common/types/item";

import Collection from "./Collection";

////////////////////////////////////////////////////////////////////////////////

export interface IGroupsChangeEvent extends IComponentChangeEvent<Groups>
{
    what: "add" | "remove";
    group: IGroup;
}

export interface IGroup
{
    id?: string;
    title: string;
    description: string;
}

export default class Groups extends Collection<IGroup>
{
    static readonly type: string = "Groups";

    protected rootCollection: Groups = null;

    create()
    {
        this.rootCollection = this.findRootCollection();
    }

    createGroup(): string
    {
        const group: IGroup = {
            title: "New Group",
            description: ""
        };

        return this.addGroup(group);
    }

    addGroup(group: IGroup): string
    {
        const id = this.insert(group);

        if (this.rootCollection) {
            this.rootCollection.addGroup(group);
        }

        this.emit<IGroupsChangeEvent>({ type: "change", what: "add", group, component: this });

        return id;
    }

    removeGroup(id: string): IGroup
    {
        const group = this.remove(id);

        if (this.rootCollection) {
            this.rootCollection.removeGroup(id);
        }

        this.emit<IGroupsChangeEvent>({ type: "change", what: "remove", group, component: this });

        return group;
    }

    fromData(data: IGroupData[]): string[]
    {
        return data.map(groupData =>
            this.addGroup({
                title: groupData.title,
                description: groupData.description || ""
            })
        );
    }

    toData(): { data: IGroupData[], ids: Dictionary<number> }
    {
        const groups = this.getArray();
        const result = { data: [], ids: {} };

        groups.forEach((group, index) => {

            result.ids[group.id] = index;

            const groupData: IGroupData = {
                title: group.title
            };

            if (group.description) {
                groupData.description = group.description;
            }

            result.data.push(groupData);
        });

        return result;
    }
}