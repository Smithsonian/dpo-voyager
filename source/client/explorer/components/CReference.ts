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

import Component, { IComponentChangeEvent } from "@ff/graph/Component";

import { IReference as IReferenceData } from "common/types/presentation";

////////////////////////////////////////////////////////////////////////////////

export interface IReferenceChangeEvent extends IComponentChangeEvent<CReference> { }

export default class CReference extends Component
{
    static readonly type: string = "CReference";

    protected uri: string = "";
    protected mimeType: string = "";

    setReference(uri: string, mimeType?: string)
    {
        this.uri = uri;
        this.mimeType = mimeType || "";

        this.load();

        this.emit<IReferenceChangeEvent>({ type: "change", what: "reference", component: this });
    }

    fromData(data: IReferenceData)
    {
        this.uri = data.uri;
        this.mimeType = data.mimeType || "";
    }

    toData(): IReferenceData
    {
        const data: IReferenceData = {
            uri: this.uri
        };

        if (this.mimeType) {
            data.mimeType = this.mimeType;
        }

        return data;
    }

    protected load()
    {
        // TODO: Implement
        // create loader
        // load
        // attach to mesh component in same entity
    }
}