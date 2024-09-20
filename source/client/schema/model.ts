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

import { Dictionary } from "@ff/core/types";
import { ColorRGB, EUnitType, TUnitType, Vector3, Vector4 } from "./common";
import { QuaternionTuple } from "three";

////////////////////////////////////////////////////////////////////////////////

export { EUnitType, TUnitType };

export type TNormalSpaceType = "Tangent" | "Object";

export enum EDerivativeUsage { Image2D, Web3D, App3D, iOSApp3D, Print3D, Editorial3D }
export type TDerivativeUsage = "Image2D" | "Web3D" | "App3D" | "iOSApp3D" | "Print3D" | "Editorial3D";

export enum EDerivativeQuality { Thumb, Low, Medium, High, Highest, AR }
export type TDerivativeQuality = "Thumb" | "Low" | "Medium" | "High" | "Highest" | "AR";

export enum EAssetType { Model, Geometry, Image, Texture, Points, Volume }
export type TAssetType = "Model" | "Geometry" | "Image" | "Texture" | "Points" | "Volume";

export enum EMapType { Color, Emissive, Occlusion, Normal, MetallicRoughness, Zone }
export type TMapType = "Color" | "Emissive" | "Occlusion" | "Normal" | "MetallicRoughness" | "Zone";

export enum ESideType { Front, Back, Double }
export type TSideType = "Front" | "Back" | "Double";


export interface IModel
{
    units: TUnitType;
    tags?: string;
    derivatives: IDerivative[];

    visible?: boolean;
    renderOrder?: number;
    overlayMap?: number;
    shadowSide?: TSideType;
    translation?: Vector3;
    rotation?: QuaternionTuple;
    boundingBox?: IBoundingBox;
    material?: IPBRMaterialSettings;
    annotations?: IAnnotation[];
}

/**
 * Connects annotated information to a spatial location.
 * Annotation targets are specific locations (spots) or areas (zones) on an item.
 */
export interface IAnnotation
{
    id: string;

    title?: string;
    titles?: Dictionary<string>;
    lead?: string;
    leads?: Dictionary<string>;
    marker?: string;
    tags?: string[];
    taglist?: Dictionary<string[]>;
    articleId?: string;
    imageUri?: string;
    imageCredit?: Dictionary<string>;
    imageAltText?: Dictionary<string>;
    audioId?: string;
    viewId?: string;

    style?: string;
    visible?: boolean;
    expanded?: boolean;

    position?: Vector3;
    direction?: Vector3;
    scale?: number;
    offset?: number;
    tilt?: number;
    azimuth?: number;
    color?: number[];

    zoneIndex?: number;
}

/**
 * Axis-aligned bounding box.
 */
export interface IBoundingBox
{
    min: Vector3;
    max: Vector3;
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

export interface IPBRMaterialSettings
{
    color?: ColorRGB
    opacity?: number;
    hiddenOpacity?: number;
    roughness?: number;
    metalness?: number;
    occlusion?: number;
    //emissiveFactor?: ColorRGB;
    //alphaMode?: any; // TODO
    //alphaCutoff?: number;
    transparent?: boolean;
    doubleSided?: boolean;
    normalSpace?: TNormalSpaceType;
}
