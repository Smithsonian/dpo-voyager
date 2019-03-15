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
import { ITweenState, ITweenTarget } from "@ff/graph/components/CTweenMachine";

import { TUnitType, EUnitType } from "./item";
import { Vector3 } from "./model";

////////////////////////////////////////////////////////////////////////////////

export { TUnitType, EUnitType };

export type TShaderMode = "Default" | "Clay" | "XRay" | "Normals" | "Wireframe";
export enum EShaderMode { Default, Clay, XRay, Normals, Wireframe }

export type TBackgroundStyle = "Solid" | "LinearGradient" | "RadialGradient";
export enum EBackgroundStyle { Solid, LinearGradient, RadialGradient }

export type TNavigationType = "Orbit" | "Walk";
export enum ENavigationType { Orbit, Walk }

export type TReaderPosition = "Overlay" | "Left" | "Right";
export enum EReaderPosition { Overlay, Left, Right }

export type TSliceAxis = "X" | "Y" | "Z";
export enum ESliceAxis { X, Y, Z }


export interface IFeatures
{
    meta?: IMeta;
    process?: IProcess;
    articles?: IArticles;
    annotations?: IAnnotations;
    interface?: IInterface;
    reader?: IReader;
    navigation?: INavigation;
    scene?: IScene;
    background?: IBackground;
    floor?: IFloor;
    grid?: IGrid;
    story?: IStory;
    tapeTool?: ITapeTool;
    sliceTool?: ISliceTool;
}

/**
 * Meta data section of a collection item.
 */
export interface IMeta
{
    [id: string]: any;
}

/**
 * Meta-data describing the capture, computation, and editorial process.
 */
export interface IProcess
{
    [key: string]: any;
}

/**
 * Describes the annotations of an item, organized in groups.
 */
export interface IAnnotations
{
    annotations?: IAnnotation[];
}

/**
 * Connects annotated information to a spatial location.
 * Annotation targets are specific locations (spots) or areas (zones) on an item.
 */
export interface IAnnotation
{
    id: Identifier;
    title?: string;
    description?: string;
    tags?: string[];
    articles?: Identifier[];

    style?: string;
    visible?: boolean;
    expanded?: boolean;

    position?: Vector3;
    direction?: Vector3;
    scale?: number;
    offset?: number;
    tilt?: number;
    azimuth?: number;

    zoneIndex?: number;
}

export interface IArticles
{
    mainArticleId?: Identifier;
    articles?: IArticle[];
}

/**
 * Refers to an external document or a media file (audio, video, image).
 */
export interface IArticle
{
    id: Identifier;
    title?: string;
    description?: string;
    uri?: string;
    mimeType?: string;
    thumbnailUri?: string;
}

export interface IScene
{
    units: TUnitType;
    shader: TShaderMode;
    exposure: number;
    gamma: number;
}

export interface IReader
{
    visible: boolean;
    position: string;
    url: string;
}

export interface IInterface
{
    visible: boolean;
    logo: boolean;
    menu: boolean;
    tools: boolean;
}

export interface INavigation
{
    type: TNavigationType;
    enabled: boolean;
    orbit?: IOrbitNavigation;
    walk?: IWalkNavigation;
}

export interface IOrbitNavigation
{
    orbit: number[];
    offset: number[];
    minOrbit: number[];
    maxOrbit: number[];
    minOffset: number[];
    maxOffset: number[];
}

export interface IWalkNavigation
{
    position: number[];
    rotation: number[];
    minPosition: number[];
    maxPosition: number[];
}

export interface IBackground
{
    style: TBackgroundStyle;
    color0: number[];
    color1: number[];
}

export interface IFloor
{
    visible: boolean;
    position: number[];
    size: number;
    color: number[];
    opacity: number;
    receiveShadow: boolean;
}

export interface IGrid
{
    visible: boolean;
    color: number[];
}

export interface ITapeTool
{
    enabled: boolean;
    startPosition: number[];
    startDirection: number[];
    endPosition: number[];
    endDirection: number[];
}

export interface ISliceTool
{
    enabled: boolean;
    axis: TSliceAxis;
    inverted: boolean;
    position: number;
}

/**
 * Describes the story elements of an item: snapshots and tours.
 */
export interface IStory
{
    tours?: ITour[];
}

/**
 * A tour consists of a sequence of tour steps, where each step
 * recalls a snapshot.
 */
export interface ITour
{
    title: string;
    description: string;
    steps: ITweenState[];
    targets: ITweenTarget[];
}
