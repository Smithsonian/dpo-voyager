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

import { types } from "@ff/graph/propertyTypes";
import CModel from "@ff/scene/components/CModel";

import { IDocument, INode } from "common/types/document";
import { IModel, EUnitType, EDerivativeUsage, EDerivativeQuality } from "common/types/model";

import unitScaleFactor from "../utils/unitScaleFactor";
import UberPBRMaterial, { EShaderMode } from "../shaders/UberPBRMaterial";
import Derivative from "../models/Derivative";
import DerivativeList from "../models/DerivativeList";

////////////////////////////////////////////////////////////////////////////////

export default class CVModel extends CModel
{
    static readonly typeName: string = "CVModel";

    protected static ins = {
        globalUnits: types.Enum("Model.GlobalUnits", EUnitType, EUnitType.cm),
        localUnits: types.Enum("Model.LocalUnits", EUnitType, EUnitType.cm),
        shader: types.Enum("Model.Shader", EShaderMode, EShaderMode.Default),
        quality: types.Enum("Model.Quality", EDerivativeQuality, EDerivativeQuality.High),
        autoLoad: types.Boolean("Model.AutoLoad", true),
        position: types.Vector3("Model.Position"),
        rotation: types.Vector3("Model.Rotation"),
        center: types.Event("Model.Center"),
        dumpDerivatives: types.Event("Derivatives.Dump"),
    };

    protected static outs = {

    };

    ins = this.addInputs<CModel, typeof CVModel.ins>(CVModel.ins);
    outs = this.addOutputs<CModel, typeof CVModel.outs>(CVModel.outs);


}