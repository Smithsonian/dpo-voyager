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

import * as mathSchema from "common/schema/math.schema.json";

import * as presentationSchema from "common/schema/presentation.schema.json";
import * as voyagerSchema from "common/schema/voyager.schema.json";

import * as itemSchema from "common/schema/item.schema.json";
import * as metaSchema from "common/schema/meta.schema.json";
import * as processSchema from "common/schema/process.schema.json";
import * as modelSchema from "common/schema/model.schema.json";
import * as annotationsSchema from "common/schema/annotations.schema.json";
import * as storySchema from "common/schema/story.schema.json";
import * as documentsSchema from "common/schema/documents.schema.json";

import { IPresentation } from "common/types/presentation";
import { IItem } from "common/types/item";

////////////////////////////////////////////////////////////////////////////////

export default class PresentationValidator
{
    private _schemaValidator;
    private _validatePresentation;
    private _validateItem;

    constructor()
    {
        this._schemaValidator = new Ajv({
            schemas: [
                mathSchema,
                presentationSchema,
                voyagerSchema,
                itemSchema,
                metaSchema,
                processSchema,
                modelSchema,
                documentsSchema,
                annotationsSchema,
                storySchema
            ],
            allErrors: true
        });

        this._validatePresentation = this._schemaValidator.getSchema(
            "https://schemas.3d.si.edu/public_api/presentation.schema.json"
        );

        this._validateItem = this._schemaValidator.getSchema(
            "https://schemas.3d.si.edu/public_api/item.schema.json"
        );
    }

    validatePresentation(presentation: IPresentation): boolean
    {
        if (!this._validatePresentation(presentation)) {
            console.warn(this._schemaValidator.errorsText(
                this._validatePresentation.errors, { separator: ", ", dataVar: "presentation" }));
            return false;
        }

        return true;
    }

    validateItem(item: IItem): boolean
    {
        if (!this._validateItem(item)) {
            console.warn(this._schemaValidator.errorsText(
                this._validateItem.errors, { separator: ", ", dataVar: "item" }));
            return false;
        }

        return true;
    }
}