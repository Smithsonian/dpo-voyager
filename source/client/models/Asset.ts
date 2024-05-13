/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import { EAssetType, EMapType, IAsset as IAssetJSON, TAssetType, TMapType } from "client/schema/model";

////////////////////////////////////////////////////////////////////////////////

export { EAssetType, EMapType };

export type IAssetUpdateEvent = IDocumentUpdateEvent<Asset>;
export type IAssetDisposeEvent = IDocumentDisposeEvent<Asset>;

// @ts-ignore: change property type from string to enum
export interface IAsset extends IAssetJSON
{
    type: EAssetType;
    mapType: EMapType;
}

export default class Asset extends Document<IAsset, IAssetJSON>
{
    static readonly mimeType = {
        gltfJson: "model/gltf+json",
        gltfBinary: "model/gltf-binary",
        imageJpeg: "image/jpeg",
        imagePng: "image/png"
    };

    setModel(uri: string)
    {
        this.data.uri = uri;
        this.data.type = EAssetType.Model;
        this.data.mimeType = this.guessAssetMimeType();
    }

    setGeometry(uri: string)
    {
        this.data.uri = uri;
        this.data.type = EAssetType.Geometry;
        this.data.mimeType = this.guessAssetMimeType();
    }

    setTexture(uri: string, mapType: EMapType)
    {
        this.data.uri = uri;
        this.data.type = EAssetType.Image;
        this.data.mimeType = this.guessAssetMimeType();
        this.data.mapType = mapType;
    }

    isValid()
    {
        return !!this.data.uri && this.data.type !== undefined;
    }

    toString()
    {
        const data = this.data;
        return `Asset - type: '${EAssetType[data.type]}', uri: '${data.uri}', mime type: '${data.mimeType || "(not set)"}'`;
    }

    protected init()
    {
        return {
            uri: "",
            mimeType: "",
            type: undefined,
            mapType: undefined,
            byteSize: 0,
            numFaces: 0,
            numVertices: 0,
            imageSize: 0,
        };
    }

    protected deflate(data: IAsset, json: IAssetJSON)
    {
        json.uri = data.uri;
        json.type = EAssetType[data.type] as TAssetType;

        if (data.mimeType) {
            json.mimeType = data.mimeType;
        }
        if (data.mapType !== undefined) {
            json.mapType = EMapType[data.mapType] as TMapType;
        }
        if (data.byteSize > 0) {
            json.byteSize = data.byteSize;
        }

        // for model and geometry assets, save number of faces
        if (data.type === EAssetType.Model || data.type === EAssetType.Geometry) {
            if (data.numFaces > 0) {
                json.numFaces = data.numFaces;
            }
        }

        // for model, image, and texture assets, save image/map size
        if (data.type === EAssetType.Model || data.type === EAssetType.Image || data.type === EAssetType.Texture) {
            if (data.imageSize > 0) {
                json.imageSize = data.imageSize;
            }
        }
    }

    protected inflate(json: IAssetJSON, data: IAsset)
    {
        data.uri = json.uri;
        data.mimeType = json.mimeType || "";
        data.type = EAssetType[json.type];
        data.mapType = EMapType[json.mapType];
        data.byteSize = json.byteSize || 0;
        data.numFaces = json.numFaces || 0;
        data.imageSize = json.imageSize || 0;

        if (data.type === undefined) {
            data.type = this.guessAssetType();
            if (data.type === undefined) {
                console.warn(`failed to determine asset type from asset: ${data.uri}`);
            }
        }
    }

    protected guessAssetType(): EAssetType
    {
        const data = this.data;

        if (data.type !== undefined && EAssetType[data.type]) {
            return data.type;
        }

        if (data.mimeType) {
            if (data.mimeType === Asset.mimeType.gltfJson || data.mimeType === Asset.mimeType.gltfBinary) {
                return EAssetType.Model;
            }
            if (data.mimeType === Asset.mimeType.imageJpeg || data.mimeType === Asset.mimeType.imagePng) {
                return EAssetType.Image;
            }
        }

        const extension = data.uri.split(".").pop().toLowerCase();

        if (extension === "gltf" || extension === "glb") {
            return EAssetType.Model
        }
        if (extension === "obj" || extension === "ply") {
            return EAssetType.Geometry
        }
        if (extension === "jpg" || extension === "png") {
            return EAssetType.Image;
        }

        return undefined;
    }

    protected guessAssetMimeType(): string
    {
        const data = this.data;

        if (data.mimeType) {
            return data.mimeType;
        }

        const extension = data.uri.split(".").pop().toLowerCase();

        if (extension === "gltf") {
            return Asset.mimeType.gltfJson;
        }
        if (extension === "glb") {
            return Asset.mimeType.gltfBinary;
        }
        if (extension === "jpg") {
            return Asset.mimeType.imageJpeg;
        }
        if (extension === "png") {
            return Asset.mimeType.imagePng;
        }

        return "";
    }
}