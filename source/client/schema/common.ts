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

export type TUnitType = "mm" | "cm" | "m" | "km" | "in" | "ft" | "yd" | "mi";
export enum EUnitType { mm, cm, m, km, in, ft, yd, mi }

export type Vector3 = number[];
export type Vector4 = number[];
export type Matrix4 = number[];
export type Quaternion = Vector4;
export type ColorRGB = Vector3;
export type ColorRGBA = Vector4;

export type TLanguageType = "EN" | "ES" | "DE" | "NL" | "JA" | "FR" | "IT" | "HAW";
export enum ELanguageType { EN, ES, DE, NL, JA, FR, IT, HAW }
export enum ELanguageStringType {
    EN = 'English',
    ES = 'Spanish (Español)',
    DE = 'German (Deutsch)',
    NL = 'Dutch (Nederlands)',
    JA = 'Japanese (日本語)',
    FR = 'French (Français)',
    IT = 'Italian (Italiano)',
    HAW = 'Hawaiian (ʻŌlelo Hawaiʻi)',
}
export const DEFAULT_LANGUAGE = "EN";


