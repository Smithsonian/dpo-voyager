/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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

import AjvCore from "ajv";

import documentSchema from "client/schema/json/document.schema.json";
import commonSchema from "client/schema/json/common.schema.json";
import metaSchema from "client/schema/json/meta.schema.json";
import modelSchema from "client/schema/json/model.schema.json";
import setupSchema from "client/schema/json/setup.schema.json";

import type { IDocument } from "client/schema/document";

////////////////////////////////////////////////////////////////////////////////
const schemaValidator = new AjvCore({
    schemas: [
        documentSchema,
        commonSchema,
        metaSchema,
        modelSchema,
        setupSchema,
    ],
    allErrors: true
});

/**
 * Web worker that validates a document data against the JSON-schema
 */
onmessage = ({data}:MessageEvent<IDocument|undefined>) => {
    const validateDocument = schemaValidator.getSchema(
        "https://schemas.3d.si.edu/voyager/document.schema.json"
    );
    if (!validateDocument(data)) {
        postMessage(schemaValidator.errorsText(
            validateDocument.errors, { separator: ", ", dataVar: "document" }));
    }else{
        postMessage(undefined);
    }
};
