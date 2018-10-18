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

import { IItem, TDerivativeUsage, TDerivativeQuality } from "./item";
import { IPresentation, IRenderer, INode, IExplorer, TShaderType, TUnitType } from "./presentation";

////////////////////////////////////////////////////////////////////////////////

export { IItem, IPresentation }
export { INode, IExplorer, IRenderer, TUnitType };

export { TDerivativeUsage }
export enum EDerivativeUsage { Web, Print, Editorial }

export { TDerivativeQuality }
export enum EDerivativeQuality { Thumb, Low, Medium, High, Highest, LOD, Stream }

export enum EViewPreset { Left, Right, Top, Bottom, Front, Back, None }

export { TShaderType }
export enum EShaderType { Inherit, Default, PBR, Phong, Clay, Normals, Wireframe, XRay }
