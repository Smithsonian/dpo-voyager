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
import clone from "@ff/core/clone";

import { ISnapshot as ISnapshotData } from "common/types/item";

import CVCollection from "./CVCollection";

////////////////////////////////////////////////////////////////////////////////

export interface ISnapshot
{
    id?: string;
    title: string;
    description: string;
    properties: ISnapshotProperty[];
}

/** Unit of snapshot data. */
export interface ISnapshotProperty
{
    target: string;
    value: any;
}

export default class CVSnapshots extends CVCollection<ISnapshot>
{
    static readonly type: string = "CVSnapshots";

    addSnapshot(snapshot: ISnapshot)
    {
        const id = this.insert(snapshot);
        this.emit("changed");
        return id;
    }

    removeSnapshot(id: string): ISnapshot
    {
        const snapshot = this.remove(id);
        this.emit("changed");
        return snapshot;
    }

    fromData(data: ISnapshotData[]): string[]
    {
        return data.map(data =>
            this.addSnapshot({
                title: data.title || "",
                description: data.description || "",
                properties: data.properties
            })
        );
    }

    toData(): { data: ISnapshotData[], ids: Dictionary<number> }
    {
        const snapshots = this.getArray();
        const result = { data: [], ids: {} };

        snapshots.forEach((snapshot, index) => {

            result.ids[snapshot.id] = index;

            const snapData: ISnapshotData = {
                properties: clone(snapshot.properties)
            };

            if (snapshot.title) {
                snapData.title = snapshot.title;
            }
            if (snapshot.description) {
                snapData.description = snapshot.description;
            }

            result.data.push(snapData);
        });

        return result;
    }
}