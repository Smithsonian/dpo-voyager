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

import { Index } from "@ff/core/types";

import { EUnitType, TUnitType, Vector3, Quaternion, Matrix4, ColorRGB } from "./common";
import { IMeta } from "./meta";
import { IModel } from "./model";
import { ISetup } from "./setup";
import { QuaternionTuple } from "three";

////////////////////////////////////////////////////////////////////////////////

export { EUnitType, TUnitType, Vector3, Quaternion, Matrix4, ColorRGB };

export type TCameraType = "perspective" | "orthographic";
export type TLightType = "ambient" | "directional" | "point" | "spot" | "hemisphere"| "rect";

/**
 * Encapsulates a node tree representing a renderable scene.
 */
export interface IDocument
{
    asset: IDocumentAsset;
    scene?: Index;
    scenes?: IScene[];
    nodes?: INode[];
    cameras?: ICamera[];
    lights?: ILight[];
    metas?: IMeta[];
    models?: IModel[];
    setups?: ISetup[];
}

/**
 * Information about the document, such as its type, version, copyright and generator.
 */
export interface IDocumentAsset
{
    type: "application/si-dpo-3d.document+json";
    version: string;
    copyright?: string;
    generator?: string;
}

export interface IScene
{
    name?: string;
    nodes?: Index[];
    setup?: Index;
    meta?: Index;
    units: TUnitType;
}

/**
 * Node in scene hierarchy.
 */
export interface INode
{
    name?: string;
    children?: Index[];

    matrix?: Matrix4;
    translation?: Vector3;
    rotation?: QuaternionTuple;
    scale?: Vector3;

    camera?: Index;
    light?: Index;
    model?: Index;
    meta?: Index;
}

/**
 * Properties shared by all camera types.
 */
export interface ICamera
{
    type: TCameraType;
    perspective?: IPerspectiveCameraProps;
    orthographic?: IOrthographicCameraProps;
    autoNearFar?: boolean;
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
    color?: ColorRGB;
    intensity?: number;

    shadowEnabled?: boolean;
    shadowSize?: number;
    shadowResolution?: string;
    shadowBlur?: number;

    point?: IPointLightProps;
    spot?: ISpotLightProps;
    hemisphere?: IHemisphereLightProps;
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

export interface IHemisphereLightProps {
    ground :ColorRGB;
}