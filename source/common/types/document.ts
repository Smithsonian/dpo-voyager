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

import { Index } from "@ff/core/types";

import { IModel, IPart, TUnitType } from "./model";
import { IFeatures } from "./features";

////////////////////////////////////////////////////////////////////////////////

export type TMatrix4 = number[];
export type TVector3 = number[];
export type TVector4 = number[];
export type TQuaternion = TVector4;
export type TColorRGB = TVector3;

export type TCameraType = "perspective" | "orthographic";
export type TLightType = "ambient" | "directional" | "point" | "spot" | "hemisphere";


export interface IDocument
{
    asset: IDocumentAsset;
    scene: Index;
    scenes: IScene[];
    nodes?: INode[];
    cameras?: ICamera[];
    lights?: ILight[];

    extensions?: {
        "si-document"?: {
            models?: IModel[];
            parts?: IPart[];
        }
    }
}

export interface IDocumentAsset
{
    version: string;
    copyright?: string;
    generator?: string;

    extensions: {
        "si-document": {
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
        "si-document"?: {
            units: TUnitType;
            features: IFeatures;
        }
    }
}

export interface ITransform
{
    matrix?: TMatrix4;
    translation?: TVector3;
    rotation?: TQuaternion;
    scale?: TVector3;
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
        "si-document"?: {
            model: Index;
            part: Index;
        }
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
