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

import Component, { types } from "@ff/graph/Component";

import { IScene } from "common/types/document";
import { EUnitType, TUnitType } from "common/types/document";
import { IExplorer } from "common/types/explorer";

////////////////////////////////////////////////////////////////////////////////

/**
 * Graph component rendering an annotation.
 */
export default class CVScene extends Component
{
    static readonly typeName: string = "CVScene";

    protected static readonly ins = {
        units: types.Enum("Model.Units", EUnitType, EUnitType.cm),
    };

    ins = this.addInputs(CVScene.ins);

    fromData(data: IScene)
    {
        const docData = data.extensions["SI_document"];
        if (docData) {
            if (docData.units) {
                const units = EUnitType[docData.units];
                this.ins.units.setValue(units !== undefined ? units : EUnitType.cm);
            }
            if (docData.explorer) {
                this.fromExplorerData(docData.explorer);
            }
        }
    }

    toData(): IScene
    {
        const docData: any = {
            units: this.ins.units.getOptionText() as TUnitType,
        };

        const explorerData = this.toExplorerData();
        if (explorerData) {
            docData.explorer = explorerData;
        }

        return null;
    }

    protected fromExplorerData(data: IExplorer)
    {

    }

    protected toExplorerData(): IExplorer
    {
        return null;
    }
}