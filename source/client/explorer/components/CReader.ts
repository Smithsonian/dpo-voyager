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

import { types } from "@ff/graph/propertyTypes";
import Component from "@ff/graph/Component";

import { IReader, EReaderPosition } from "common/types/voyager";
import { IDocument } from "./CDocuments";

////////////////////////////////////////////////////////////////////////////////

const ins = {
    visible: types.Boolean("Visible", false),
    position: types.Enum("Position", EReaderPosition),
    url: types.String("DocumentURL", "")
};

export default class CReader extends Component
{
    static readonly type: string = "CReader";

    ins = this.addInputs(ins);

    protected documents: Dictionary<IDocument> = {};


    addDocument(document: IDocument)
    {
        this.documents[document.id] = document;
    }

    removeDocument(id: string)
    {
        delete this.documents[id];
    }

    fromData(data: IReader)
    {
        this.ins.setValues({
            visible: data.visible,
            position: EReaderPosition[data.position] || EReaderPosition.Overlay,
            url: data.url
        });
    }

    toData(): IReader
    {
        const ins = this.ins;

        return {
            visible: ins.visible.cloneValue(),
            position: EReaderPosition[ins.position.value] || "Overlay",
            url: ins.url.cloneValue()
        };
    }
}