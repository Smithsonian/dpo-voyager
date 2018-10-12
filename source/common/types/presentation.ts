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
    Index,
    Identifier
} from "@ff/core/types";

import {
    IItem,
    UnitType
} from "./item";

////////////////////////////////////////////////////////////////////////////////

export { UnitType };

export type Matrix4 = number[];
export type Vector3 = number[];
export type Vector4 = number[];
export type Quaternion = Vector4;
export type ColorRGB = Vector3;

export type CameraType = "perspective" | "orthographic";
export type LightType = "ambient" | "directional" | "point" | "spot" | "hemisphere";
export type ShaderType = "inherit" | "pbr" | "phong" | "clay" | "normals" | "wireframe" | "x-ray";

/**
 * A presentation describes an entire explorer setup.
 */
export interface IPresentation
{
    asset: IAsset;
    scene: IScene;
    nodes: INode[];
    items?: IItem[];
    references?: IReference[];
    cameras?: ICamera[];
    lights?: ILight[];
    explorer?: IExplorer;
}

export interface IAsset
{
    version: string;
    copyright?: string;
    generator?: string;
}

export interface IScene
{
    nodes: Index[];
}

export interface ITransform
{
    matrix?: Matrix4;
    translation?: Vector3;
    rotation?: Quaternion;
    scale?: Vector3;
}

/**
 * Node in scene hierarchy.
 */
export interface INode extends ITransform
{
    name?: string;
    children?: Index[];

    item?: Index;
    reference?: Index;
    camera?: Index;
    light?: Index;
}

/**
 * Reference node properties. Node references an external file (item, model, geometry)
 * which will get attached to this node in the scene hierarchy.
 */
export interface IReference
{
    mimeType?: string;
    uri: string;
}

/**
 * Properties shared by all camera types.
 */
export interface ICamera
{
    type: CameraType;
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
    type: LightType;
    color?: ColorRGB;
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
    groundColor: ColorRGB;
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
 * Viewer-specific properties.
 */
export interface IExplorer
{
    renderer?: IRenderer;
    reader?: IReader;
    tools?: ITools;
}

export interface IViewport
{
    transform: Matrix4;
    camera: ICamera;
}

/**
 * Engine state.
 */
export interface IRenderer
{
    units: UnitType;
    shader: ShaderType;
    exposure: number;
    gamma: number;
    //environment: any; // TODO
}

/**
 * Reader properties.
 */
export interface IReader
{
    enabled: boolean;
    document: Identifier;
}

export interface ITools
{
    section?: ICrossSectionProps;
    tape?: ITapeProps;
}

/**
 * Section tool properties.
 */
export interface ICrossSectionProps
{
    enabled: boolean;
    position: Vector3;
    direction: Vector3;
    color: ColorRGB;
}

/**
 * Measuring tape tool properties.
 */
export interface ITapeProps
{
    enabled: boolean;
    fromPosition: Vector3;
    fromDirection: Vector3;
    toPosition: Vector3;
    toDirection: Vector3;
}
