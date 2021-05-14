/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import AnnotationSprite from "./AnnotationSprite";
import Annotation from "../models/Annotation";
import CVAssetReader from "client/components/CVAssetReader";

////////////////////////////////////////////////////////////////////////////////

export default class AnnotationFactory
{
    protected static types: Dictionary<typeof AnnotationSprite> = {};
    protected static defaultType: typeof AnnotationSprite = null;

    static registerType(type: typeof AnnotationSprite)
    {
        if (this.types[type.typeName]) {
            throw new Error(`Annotation type '${type.typeName}' already registered.`);
        }

        this.types[type.typeName] = type;
    }

    static registerDefaultType(type: typeof AnnotationSprite)
    {
        this.defaultType = type;
    }

    static get typeNames() {
        return [ this.defaultTypeName, ...Object.keys(this.types).sort() ];
    }
    static get defaultTypeName() {
        return this.defaultType.typeName;
    }

    static getType(typeName: string): typeof AnnotationSprite
    {
        const type = this.types[typeName] || this.defaultType;

        if (!type) {
            throw new Error(`type '${typeName}' not registered and no default type set.`);
        }

        return type;
    }

    static createInstance(annotation: Annotation, typeName?: string, assetReader?: CVAssetReader): AnnotationSprite
    {
        typeName = typeName || annotation.data.style;

        // TODO: Combine when font loading is centralized
        return typeName === "Circle" ? new (this.getType(typeName))(annotation, assetReader) : new (this.getType(typeName))(annotation);
    }
}