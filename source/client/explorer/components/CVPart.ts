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

import CTransform from "@ff/scene/components/CTransform";
import CModel from "@ff/scene/components/CModel";

import CVModel from "./CVModel";
import NVFeatures from "../nodes/NVFeatures";

////////////////////////////////////////////////////////////////////////////////

/**
 * Graph component rendering an annotation.
 */
export default class CVPart extends CModel
{
    static readonly typeName: string = "CVPart";

    protected static readonly ins = {

    };

    ins = this.addInputs(CVPart.ins);

    protected model: CVModel = null;
    protected features: NVFeatures = null;

    create()
    {
        super.create();

        const transform = this.getComponent(CTransform);
        this.model = transform.getParentComponent(CVModel, false);
        this.features = transform.getSiblingNode(NVFeatures);
    }
}