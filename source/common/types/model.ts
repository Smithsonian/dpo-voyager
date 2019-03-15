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

import { IFeatures } from "./features";

////////////////////////////////////////////////////////////////////////////////

export type TUnitType = "mm" | "cm" | "m" | "in" | "ft" | "yd";

export type TNormalSpaceType = "Tangent" | "Object";

export type TDerivativeUsage = "Web2D" | "Web3D" | "Print" | "Editorial";
export type TDerivativeQuality = "Thumb" | "Low" | "Medium" | "High" | "Highest" | "LOD" | "Stream";
export type TAssetType = "Model" | "Geometry" | "Image" | "Texture" | "Points" | "Volume";
export type TMapType = "Color" | "Normal" | "Occlusion" | "Emissive" | "MetallicRoughness" | "Zone";

export type Matrix4 = number[];
export type Vector3 = number[];
export type Vector4 = number[];
export type ColorRGB = Vector3;
export type ColorRGBA = Vector4;

/**
 * Axis-aligned bounding box.
 */
export interface IBoundingBox
{
    min: Vector3;
    max: Vector3;
}

export interface IModel
{
    units: TUnitType;
    boundingBox?: IBoundingBox;
    features?: IFeatures;
}

export interface IPart
{
    material?: IMaterial;
    derivatives?: IDerivative[];
    features?: IFeatures;
}

////////////////////////////////////////////////////////////////////////////////

export interface IMaterial
{
    pbrMetallicRoughness?: IPBRMetallicRoughness;
    normalTexture?: any;
    normalSpace?: TNormalSpaceType;
    occlusionTexture?: any;
    occlusionStrength?: number;
    emissiveTexture?: any;
    emissiveFactor?: ColorRGB;
    alphaMode?: any; // TODO
    alphaCutoff?: number;
    doubleSided?: boolean;
}

export interface IPBRMetallicRoughness
{
    baseColorFactor?: ColorRGBA;
    baseColorTexture?: any;
    metallicFactor?: number;
    roughnessFactor?: number;
    metallicRoughnessTexture?: any;
}

/**
 * Derivative representation of a collection item.
 * Points to one or multiple assets (files/resources).
 */
export interface IDerivative
{
    usage: TDerivativeUsage;
    quality: TDerivativeQuality;
    assets: IAsset[];
}

/**
 * Describes an asset, a resource containing a mesh, model, image,
 * point cloud or volumetric representation.
 */
export interface IAsset
{
    uri: string;
    type: TAssetType;
    part?: string;
    mimeType?: string;
    byteSize?: number;
    numFaces?: number;
    imageSize?: number;
    mapType?: TMapType;
}