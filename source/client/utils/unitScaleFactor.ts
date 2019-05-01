/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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
import { EUnitType } from "client/schema/common";

////////////////////////////////////////////////////////////////////////////////

const _unitScaleFactor = {
    "mm": { "mm": 1, "cm": 0.1, "m": 0.001, "km": 1, "in": 0.0393701, "ft": 0.00328084, "yd": 0.00109361, "mi": 1 },
    "cm": { "mm": 10, "cm": 1, "m": 0.01, "km": 1, "in": 0.393701, "ft": 0.0328084, "yd": 0.0109361, "mi": 1 },
    "m": { "mm": 1000, "cm": 100, "m": 1, "km": 1, "in": 39.3701, "ft": 3.28084, "yd": 1.09361, "mi": 1 },
    "km": { "mm": 1000000, "cm": 100000, "m": 1000, "km": 1, "in": 39370.1, "ft": 3280.84, "yd": 1093.61, "mi": 1 },
    "in": { "mm": 25.4, "cm": 2.54, "m": 0.0254, "km": 1, "in": 1, "ft": 0.0833333, "yd": 0.0277778, "mi": 1 },
    "ft": { "mm": 304.8, "cm": 30.48, "m": 0.3048, "km": 1, "in": 12, "ft": 1, "yd": 0.333334, "mi": 1 },
    "yd": { "mm": 914.4, "cm": 91.44, "m": 0.9144, "km": 1, "in": 36, "ft": 3, "yd": 1, "mi": 1 },
    "mi": { "mm": 1.609e+6, "cm": 1.609e+5, "m": 1.609e+3, "km": 1, "in": 63346456.693, "ft": 5278871.391, "yd": 1759623.797, "mi": 1 },
};

export default function(from: EUnitType, to: EUnitType)
{
    const fromType = EUnitType[from];
    const toType = EUnitType[to];

    return _unitScaleFactor[fromType][toType] || 1;
}