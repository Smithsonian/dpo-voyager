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

import {
    IAsset,
    EAssetType,
    TAssetType,
    EMapType,
    TMapType
} from "common/types/model";

////////////////////////////////////////////////////////////////////////////////

export { IAsset, EAssetType, EMapType };

export default class Asset
{
    static readonly mimeType = {
        gltfJson: "model/gltf+json",
        gltfBinary: "model/gltf-binary",
        imageJpeg: "image/jpeg",
        imagePng: "image/png"
    };

    uri: string = "";
    mimeType: string = "";
    type: EAssetType = undefined;
    mapType: EMapType = undefined;
    byteSize: number = 0;
    numFaces: number = 0;
    numVertices: number = 0;
    imageSize: number = 0;

    constructor(type: EAssetType, uri: string)
    constructor(assetData: IAsset);
    constructor(typeOrData, uri?)
    {
        if (uri === undefined) {
            this.fromData(typeOrData);
        }
        else {
            this.type = typeOrData;
            this.uri = uri;
        }
    }

    isValid()
    {
        return !!this.uri && this.type !== undefined;
    }

    fromData(assetData: IAsset)
    {
        this.uri = assetData.uri;
        this.mimeType = assetData.mimeType || "";
        this.type = EAssetType[assetData.type];
        this.mapType = EMapType[assetData.mapType];
        this.byteSize = assetData.byteSize || 0;
        this.numFaces = assetData.numFaces || 0;
        this.imageSize = assetData.imageSize || 0;

        if (this.type === undefined) {
            this.type = this.guessAssetType();
            if (this.type === undefined) {
                console.warn(`failed to determine asset type from asset: ${this.uri}`);
            }
        }
    }

    toData(): IAsset
    {
        const data: IAsset = {
            uri: this.uri,
            type: EAssetType[this.type] as TAssetType
        };

        if (this.mimeType) {
            data.mimeType = this.mimeType;
        }
        if (this.mapType !== undefined) {
            data.mapType = EMapType[this.mapType] as TMapType;
        }
        if (this.byteSize > 0) {
            data.byteSize = this.byteSize;
        }

        // for model and geometry assets, save number of faces
        if (this.type === EAssetType.Model || this.type === EAssetType.Geometry) {
            if (this.numFaces > 0) {
                data.numFaces = this.numFaces;
            }
        }

        // for model, image, and texture assets, save image/map size
        if (this.type === EAssetType.Model || this.type === EAssetType.Image || this.type === EAssetType.Texture) {
            if (this.imageSize > 0) {
                data.imageSize = this.imageSize;
            }
        }

        return data;
    }

    toString()
    {
        return `Asset - type: '${EAssetType[this.type]}', uri: '${this.uri}', mime type: '${this.mimeType || "(not set)"}'`;
    }

    protected guessAssetType(): EAssetType
    {
        if (this.type !== undefined && EAssetType[this.type]) {
            return this.type;
        }

        if (this.mimeType) {
            if (this.mimeType === Asset.mimeType.gltfJson || this.mimeType === Asset.mimeType.gltfBinary) {
                return EAssetType.Model;
            }
            if (this.mimeType === Asset.mimeType.imageJpeg || this.mimeType === Asset.mimeType.imagePng) {
                return EAssetType.Image;
            }
        }

        const extension = this.uri.split(".").pop().toLowerCase();

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
}