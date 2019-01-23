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

import Publisher, { ITypedEvent } from "@ff/core/Publisher";

import { IGroup } from "common/types/item";

////////////////////////////////////////////////////////////////////////////////

export interface IGroupUpdateEvent extends ITypedEvent<"update">
{
    group: Group;
}

export default class Group extends Publisher
{
    readonly id: string;

    title: string = "New Group";
    description: string = "";
    visible: boolean = true;

    constructor(id: string)
    {
        super();
        this.addEvent("change");

        this.id = id;
    }

    update()
    {
        this.emit<IGroupUpdateEvent>({ type: "update", group: this });
    }

    deflate(): IGroup
    {
        const data: Partial<IGroup> = { id: this.id };

        if (this.title) {
            data.title = this.title;
        }
        if (this.description) {
            data.description = this.description;
        }
        if (this.visible) {
            data.visible = this.visible;
        }

        return data as IGroup;
    }

    inflate(data: IGroup): Group
    {
        this.title = data.title || "";
        this.description = data.description || "";
        this.visible = data.visible || false;

        return this;
    }
}
