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

import { Index, Identifier } from "@ff/core/types";

////////////////////////////////////////////////////////////////////////////////

export type TUnitType = "mm" | "cm" | "m" | "in" | "ft" | "yd";
export enum EUnitType { mm, cm, m, in, ft, yd }

export type TNormalSpaceType = "Tangent" | "Object";

export type TDerivativeUsage = "Web2D" | "Web3D" | "Print" | "Editorial";
export type TDerivativeQuality = "Thumb" | "Low" | "Medium" | "High" | "Highest" | "LOD" | "Stream";
export type TAssetType = "Model" | "Geometry" | "Image" | "Texture" | "Points" | "Volume";
export type TMapType = "Color" | "Normal" | "Occlusion" | "Emissive" | "MetallicRoughness" | "Zone";
export type TCurveType = "Linear" | "Ease" | "EaseIn" | "EaseOut";

export type Matrix4 = number[];
export type Vector3 = number[];
export type Vector4 = number[];
export type ColorRGB = Vector3;
export type ColorRGBA = Vector4;

/**
 * Item node properties. Describes a Smithsonian collection item
 * including meta data, derivatives, annotations, tours, snapshots and process information.
 */
export interface IItem
{
    info: IItemInfo;
    meta?: IMeta;
    process?: IProcess;
    model: IModel;
    documents?: IDocuments;
    annotations?: IAnnotations;
}

export interface IItemInfo
{
    type: "application/si-dpo-3d.item+json";
    version: string;
    copyright?: string;
    generator?: string;
}

/**
 * Meta data section of a collection item.
 */
export interface IMeta
{
    [id: string]: any;
}

/**
 * Model section of a collection item. Contains information about the item's
 * units, bounding box and derivative representations available for loading.
 */
export interface IModel
{
    units: TUnitType;
    derivatives: IDerivative[];
    boundingBox?: IBoundingBox;
    translation?: Vector3;
    rotation?: Vector4;
    material?: IMaterial;
}

/**
 * Axis-aligned bounding box.
 */
export interface IBoundingBox
{
    min: Vector3;
    max: Vector3;
}

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
    mimeType?: string;
    byteSize?: number;
    numFaces?: number;
    numVertices?: number;
    imageSize?: number;
    mapType?: TMapType;
}

export interface IDocuments
{
    mainDocumentId?: Identifier;
    documents?: IDocument[];
}

/**
 * Refers to an external document: an article or a media file (audio, video, image).
 */
export interface IDocument
{
    id: Identifier;
    title?: string;
    description?: string;
    uri?: string;
    mimeType?: string;
    thumbnailUri?: string;
}

/**
 * Describes the annotation elements of an item: anchors, documents and groups.
 * The top level document index points to the item's main document.
 */
export interface IAnnotations
{
    annotations?: IAnnotation[];
    groups?: IGroup[];
}

/**
 * Connects annotated information to a spatial location.
 * Annotation targets are specific locations (spots) or areas (zones) on an item.
 */
export interface IAnnotation
{
    id: string;
    title?: string;
    description?: string;
    style?: string;
    visible?: boolean;
    expanded?: boolean;
    scale?: number;
    offset?: number;
    tilt?: number;
    azimuth?: number;
    documents?: Identifier[];
    groups?: Identifier[];
    position?: Vector3;
    direction?: Vector3;
    zoneIndex?: number;
}

/**
 * Anchors can be grouped. This describes an anchor group.
 */
export interface IGroup
{
    id: Identifier;
    title?: string;
    description?: string;
    visible?: boolean;
}

/**
 * Describes the story elements of an item: snapshots and tours.
 */
export interface IStory
{
    templateUri?: string;
    snapshots?: ISnapshot[];
    tours?: ITour[];
}

/**
 * A snapshot captures a set of viewer/scene properties.
 * Snapshots can be used to bring the viewer/scene back to a specific state.
 */
export interface ISnapshot
{
    title?: string;
    description?: string;
    properties: ISnapshotProperty[];
}

/**
 * Unit of snapshot data.
 */
export interface ISnapshotProperty
{
    target: string;
    value: any;
}

/**
 * A tour consists of a sequence of tour steps, where each step
 * recalls a snapshot.
 */
export interface ITour
{
    title: string;
    description?: string;
    steps: ITourStep[];
}

/**
 * Single step within a tour.
 */
export interface ITourStep
{
    snapshot: Index;
    transitionTime?: number;
    transitionCurve?: TCurveType;
    transitionCutPoint?: number;
}

/**
 * Meta-data describing the capture, computation, and editorial process.
 */
export interface IProcess
{
    notes?: INote[];
    [key: string]: any;
}

export interface INote
{
    date: string;
    user: string;
    text: string;
}