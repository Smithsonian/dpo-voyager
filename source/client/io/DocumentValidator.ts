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

import * as Ajv from "ajv";

import * as documentSchema from "common/schema/document.schema.json";
import * as commonSchema from "common/schema/common.schema.json";
import * as metaSchema from "common/schema/meta.schema.json";
import * as modelSchema from "common/schema/model.schema.json";
import * as setupSchema from "common/schema/setup.schema.json";

import { IDocument } from "common/types/document";

////////////////////////////////////////////////////////////////////////////////

export default class DocumentValidator
{
    private _schemaValidator;
    private _validateDocument;

    constructor()
    {
        this._schemaValidator = new Ajv({
            schemas: [
                documentSchema,
                commonSchema,
                metaSchema,
                modelSchema,
                setupSchema,
            ],
            allErrors: true
        });

        this._validateDocument = this._schemaValidator.getSchema(
            "https://schemas.3d.si.edu/voyager/document.schema.json"
        );
    }

    validate(document: IDocument): boolean
    {
        if (!this._validateDocument(document)) {
            console.warn(this._schemaValidator.errorsText(
                this._validateDocument.errors, { separator: ", ", dataVar: "document" }));
            return false;
        }

        console.log("JSONValidator.validateDocument - OK");
        return true;
    }
}