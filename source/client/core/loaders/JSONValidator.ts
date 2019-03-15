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

import * as annotationsSchema from "common/schema/annotations.schema.json";
import * as articlesSchema from "common/schema/articles.schema.json";
import * as derivativeSchema from "common/schema/derivative.schema.json";
import * as documentSchema from "common/schema/document.schema.json";
import * as featuresSchema from "common/schema/features.schema.json";
import * as itemSchema from "common/schema/item.schema.json";
import * as mathSchema from "common/schema/math.schema.json";
import * as metaSchema from "common/schema/meta.schema.json";
import * as modelSchema from "common/schema/model.schema.json";
import * as model2Schema from "common/schema/model2.schema.json";
import * as partSchema from "common/schema/part.schema.json";
import * as presentationSchema from "common/schema/presentation.schema.json";
import * as processSchema from "common/schema/process.schema.json";
import * as toursSchema from "common/schema/tours.schema.json";

import { IDocument } from "common/types/document";
import { IPresentation } from "common/types/presentation";
import { IItem } from "common/types/item";

////////////////////////////////////////////////////////////////////////////////

export default class JSONValidator
{
    private _schemaValidator;
    private _validateDocument;
    private _validatePresentation;
    private _validateItem;

    constructor()
    {
        this._schemaValidator = new Ajv({
            schemas: [
                annotationsSchema,
                articlesSchema,
                derivativeSchema,
                documentSchema,
                featuresSchema,
                itemSchema,
                mathSchema,
                metaSchema,
                modelSchema,
                model2Schema,
                partSchema,
                presentationSchema,
                processSchema,
                toursSchema,
            ],
            allErrors: true
        });

        this._validateDocument = this._schemaValidator.getSchema(
            "https://schemas.3d.si.edu/voyager/document.schema.json"
        );

        this._validatePresentation = this._schemaValidator.getSchema(
            "https://schemas.3d.si.edu/voyager/presentation.schema.json"
        );

        this._validateItem = this._schemaValidator.getSchema(
            "https://schemas.3d.si.edu/voyager/item.schema.json"
        );
    }

    validateDocument(document: IDocument): boolean
    {
        if (!this._validateDocument(document)) {
            console.warn(this._schemaValidator.errorsText(
                this._validateDocument.errors, { separator: ", ", dataVar: "document" }));
            return false;
        }

        console.log("JSONValidator.validateDocument - OK");
        return true;
    }

    validatePresentation(presentation: IPresentation): boolean
    {
        if (!this._validatePresentation(presentation)) {
            console.warn(this._schemaValidator.errorsText(
                this._validatePresentation.errors, { separator: ", ", dataVar: "presentation" }));
            return false;
        }

        console.log("JSONValidator.validatePresentation - OK");
        return true;
    }

    validateItem(item: IItem): boolean
    {
        if (!this._validateItem(item)) {
            console.warn(this._schemaValidator.errorsText(
                this._validateItem.errors, { separator: ", ", dataVar: "item" }));
            return false;
        }

        console.log("JSONValidator.validateItem - OK");
        return true;
    }
}