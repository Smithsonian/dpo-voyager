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

import { Index, Identifier, Dictionary } from "@ff/core/types";

import { IExplorer } from "./explorer";
import { IModel } from "./model";

////////////////////////////////////////////////////////////////////////////////

export type TMatrix4 = number[];
export type TVector3 = number[];
export type TVector4 = number[];
export type TQuaternion = TVector4;
export type TColorRGB = TVector3;

export type TCameraType = "perspective" | "orthographic";
export type TLightType = "ambient" | "directional" | "point" | "spot" | "hemisphere";

export type TUnitType = "inherit" | "mm" | "cm" | "m" | "in" | "ft" | "yd";
export enum EUnitType { inherit, mm, cm, m, in, ft, yd }

export interface IDocument
{
    asset: IDocumentAsset;
    scene: Index;
    scenes: IScene[];
    nodes?: INode[];
    cameras?: ICamera[];
    lights?: ILight[];

    extensions?: {
        "SI_document"?: {
            groups?: IGroupItem[];
            models?: IModelItem[];
        }
    }
}

export interface IDocumentAsset
{
    version: string;
    copyright?: string;
    generator?: string;

    extensions: {
        "SI_document": {
            type: "application/si-dpo-3d.document+json";
            version: string;
        }
    }
}

export interface IScene
{
    name?: string;
    nodes: Index[];

    extensions?: {
        "SI_document"?: ISceneItem;
    }
}

export interface IItem
{
    units?: TUnitType;
    meta?: Dictionary<any>;
    articles?: IArticle[];
    article?: Index;
    annotations?: IAnnotation[];
}

export interface ISceneItem extends IItem
{
    explorer?: IExplorer;
}

export interface IGroupItem extends IItem
{
}

export interface IModelItem extends IItem
{
    model?: IModel;
}

export interface ITransform
{
    matrix?: TMatrix4;
    translation?: TVector3;
    rotation?: TQuaternion;
    scale?: TVector3;
}

export interface INodeExt
{
    group?: Index;
    model?: Index;
}

/**
 * Node in scene hierarchy.
 */
export interface INode extends ITransform
{
    name?: string;
    children?: Index[];

    camera?: Index;
    light?: Index;

    extensions?: {
        "SI_document"?: INodeExt;
    }
}

/**
 * Properties shared by all camera types.
 */
export interface ICamera
{
    type: TCameraType;
    perspective?: IPerspectiveCameraProps;
    orthographic?: IOrthographicCameraProps;
}

/**
 * Properties for perspective cameras.
 */
export interface IPerspectiveCameraProps
{
    yfov: number;
    znear?: number;
    zfar?: number;
}

/**
 * Properties for orthographic cameras.
 */
export interface IOrthographicCameraProps
{
    ymag: number;
    znear?: number;
    zfar?: number;
}

/**
 * Properties shared by all light types.
 */
export interface ILight
{
    type: TLightType;
    color?: TColorRGB;
    intensity?: number;
    castShadow?: boolean;
    hemisphere?: IHemisphereLightProps;
    point?: IPointLightProps;
    spot?: ISpotLightProps;
}

/**
 * Properties for hemisphere lights.
 */
export interface IHemisphereLightProps
{
    groundColor: TColorRGB;
}

/**
 * Properties for point lights.
 */
export interface IPointLightProps
{
    distance: number;
    decay: number;
}

/**
 * Properties for spot lights.
 */
export interface ISpotLightProps extends IPointLightProps
{
    angle: number;
    penumbra: number;
}

/**
 * Connects annotated information to a spatial location.
 * Annotation targets are specific locations (spots) or areas (zones) on an item.
 */
export interface IAnnotation
{
    title?: string;
    lead?: string;
    tags?: string[];
    articles?: Index[];

    style?: string;
    visible?: boolean;
    expanded?: boolean;

    position?: TVector3;
    direction?: TVector3;
    scale?: number;
    offset?: number;
    tilt?: number;
    azimuth?: number;

    zoneIndex?: number;
}

/**
 * Refers to an external document or a media file (audio, video, image).
 */
export interface IArticle
{
    title?: string;
    lead?: string;
    tags?: string[];

    uri?: string;
    mimeType?: string;
    thumbnailUri?: string;
}