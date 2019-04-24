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


export interface ISetup
{
    interface?: IInterface;
    viewer?: IViewer;
    reader?: IReader;
    navigation?: INavigation;
    background?: IBackground;
    floor?: IFloor;
    grid?: IGrid;
    tape?: ITape;
    slicer?: ISlicer;
    tours?: ITours;
    snapshots?: ISnapshots;
}

export interface IInterface
{
    visible: boolean;
    logo: boolean;
    menu: boolean;
    tools: boolean;
}

export interface IViewer
{
    shader: TShaderMode;
    exposure: number;
    gamma: number;
    annotationsVisible: boolean;
}

export interface IReader
{
    enabled: boolean;
    position: string;
    articleId?: string;
}

export interface INavigation
{
    type: TNavigationType;
    enabled: boolean;
    autoZoom: boolean;
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

export interface ITape
{
    enabled: boolean;
    startPosition: number[];
    startDirection: number[];
    endPosition: number[];
    endDirection: number[];
}

export interface ISlicer
{
    enabled: boolean;
    axis: TSliceAxis;
    inverted: boolean;
    position: number;
}

export type ITours = ITour[];

export interface ISnapshots
{
    features: string[];
    targets: string[];
    states: {
        id: string;
        curve: string;
        duration: number;
        threshold: number;
        values: any[];
    }[];
}

export interface ITour
{
    title: string;
    steps: ITourStep[];
    lead?: string;
    tags?: string[];
}

export interface ITourStep
{
    title: string;
    id: string;
}