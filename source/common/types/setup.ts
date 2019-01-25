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

import { TUnitType, EUnitType } from "./item";

////////////////////////////////////////////////////////////////////////////////

export { TUnitType, EUnitType };

export type TShaderMode = "Default" | "Clay" | "XRay" | "Normals" | "Wireframe";
export enum EShaderMode { Default, Clay, XRay, Normals, Wireframe }

export type TBackgroundType = "Solid" | "LinearGradient" | "RadialGradient";
export enum EBackgroundType { Solid, LinearGradient, RadialGradient }

export type TNavigationType = "Orbit" | "Walk";
export enum ENavigationType { Orbit, Walk }

export type TReaderPosition = "Overlay" | "Left" | "Right";
export enum EReaderPosition { Overlay, Left, Right }


export interface ISetup
{
    scene?: IScene;
    reader?: IReader;
    interface?: IInterface;
    navigation?: INavigation;
    background?: IBackground;
    groundPlane?: IGroundPlane;
    grid?: IGrid;
    tapeTool?: ITapeTool;
    sectionTool?: ISectionTool;
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

export interface IInterface
{
    visible: boolean;
    logo: boolean;
}

export interface IReader
{
    visible: boolean;
    position: string;
    url: string;
}

export interface IScene
{
    units: TUnitType;
    shader: TShaderMode;
    exposure: number;
    gamma: number;
}

export interface IGrid
{
    visible: boolean;
    color: number[];
}

export interface IBackground
{
    type: TBackgroundType;
    color0: number[];
    color1: number[];
}

export interface IGroundPlane
{
    visible: boolean;
    offset: number;
    color: number[];
    shadowVisible: boolean;
    shadowColor: number[];
}

export interface ITapeTool
{
    active: boolean;
    startPosition: number[];
    startDirection: number[];
    endPosition: number[];
    endDirection: number[];
}

export interface ISectionTool
{
    active: boolean;
    plane: number[];
}
