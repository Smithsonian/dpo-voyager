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

import CVPart from "../components/CVPart";
import NVFeatures from "./NVFeatures";
import NVNode from "./NVNode";

////////////////////////////////////////////////////////////////////////////////

export default class NVPart extends NVNode
{
    static readonly typeName: string = "NVPart";


    private _features: NVFeatures = null;


    createComponents()
    {
        super.createComponents();
        this.createComponent(CVPart);

        this._features = this.graph.createCustomNode(NVFeatures);
        this.transform.addChild(this._features.transform);
    }


}