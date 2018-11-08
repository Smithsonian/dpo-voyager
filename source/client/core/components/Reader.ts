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

import resolvePathname from "resolve-pathname";
import * as url from "url";
//window.url = url;
import * as showdown from "showdown";

import { Dictionary } from "@ff/core/types";
import Component from "@ff/core/ecs/Component";
import types from "@ff/core/ecs/propertyTypes";

import { IReader } from "common/types";
import { default as Documents, IDocument } from "./Documents";

////////////////////////////////////////////////////////////////////////////////

export default class Reader extends Component
{
    static readonly type: string = "Reader";

    ins = this.makeProps({
        ena: types.Boolean("Enabled", false),
        doc: types.String("DocumentUri", "")
    });

    outs = this.makeProps({
        html: types.String("HTML", "")
    });

    protected documents: Dictionary<IDocument> = {};
    protected converter = new showdown.Converter();

    update()
    {
        const { ena, doc } = this.ins;

        if (ena.changed) {
            // TODO: Test/Demo
            if (ena.value && !doc.value) {
                const docs = this.getComponent(Documents, true).getDocuments();
                if (docs.length > 0) {
                    doc.setValue(docs[0].uri);
                }
            }
        }

        if (doc.changed) {
            this.loadDocument();
        }
    }

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
            ena: data.enabled,
            doc: data.documentUri
        });
    }

    toData(): IReader
    {
        const { ena, doc } = this.ins;

        return {
            enabled: ena.value,
            documentUri: doc.value
        }
    }

    protected loadDocument()
    {
        const { doc } = this.ins;
        const { html } = this.outs;

        const uri = doc.value;
        if (!uri) {
            html.pushValue("");
            return;
        }

        const url = resolvePathname(uri, window.location.pathname);
        console.log("Reader.loadDocument - " + url);
        const extension = url.split(".").pop();

        if (["html", "md"].indexOf(extension) === -1) {
            console.warn(`unsupported document type: ${url}`);
            return;
        }

        fetch(url).then(result => {
            if (result.ok) {
                return result.text();
            }
            else {
                throw new Error(`failed to fetch document: ${url}`);
            }
        }).then(content => {
                if (extension === "md") {
                    content = this.converter.makeHtml(content);
                }

                html.pushValue(content);

        }).catch(error => {
            console.warn(error.message);
        })


    }
}