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

import Document, { IDocumentDisposeEvent, IDocumentUpdateEvent } from "@ff/core/Document";

import { ITour } from "common/types/scene";

////////////////////////////////////////////////////////////////////////////////

export { ITour };

export type ITourUpdateEvent = IDocumentUpdateEvent<Tour>;
export type ITourDisposeEvent = IDocumentDisposeEvent<Tour>;

export default class Tour extends Document<ITour>
{
    static fromJSON(json: ITour)
    {
        return new Tour(json);
    }

    protected init()
    {
        return {
            id: this.generateId(),
            title: "New Tour",
            lead: "",
            tags: [],
            states: [],
            targets: []
        };
    }

    protected deflate(data: ITour, json: ITour)
    {
        json.id = data.id;
        json.states = data.states;
        json.targets = data.targets;

        if (data.title) {
            json.title = data.title;
        }
        if (data.lead) {
            json.lead = data.lead;
        }
        if (data.tags.length > 0) {
            json.tags = data.tags.slice();
        }
    }

    protected inflate(json: ITour, data: ITour)
    {
        data.id = json.id;
        data.states = json.states;
        data.targets = json.targets;

        data.title = json.title || "";
        data.lead = json.lead || "";
        data.tags = json.tags || [];
    }
}
