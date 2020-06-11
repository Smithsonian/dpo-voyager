/**
 * 3D Foundation Project
 * Copyright 2020 Smithsonian Institution
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

import * as THREE from "three";

import Component, { types } from "@ff/graph/Component";
import CVAssetReader from "./CVAssetReader";
import CVScene from "./CVScene";
import UberPBRMaterial from "../shaders/UberPBRMaterial";

const images = ["Footprint_Court_1k_TMap.jpg", "spruit_sunrise_1k_LDR.jpg","1024px-Adliswil_Hauptplatz_panosphere_20200205.jpg"];  

////////////////////////////////////////////////////////////////////////////////

export default class CVEnvironment extends Component
{
    static readonly typeName: string = "CVEnvironment";
    static readonly text: string = "Environment";

    protected static readonly envIns = {
        imageIndex: types.Integer("Environment.Index", { preset: 0, options: images.map( function(item, index) {return index.toString();}) }),
        dirty: types.Event("Environment.Dirty")
    };

    ins = this.addInputs(CVEnvironment.envIns);

    private _texture: THREE.Texture = null;

    protected get assetReader() {
        return this.getMainComponent(CVAssetReader);
    }

    update()
    {
        const ins = this.ins;

        if(ins.imageIndex.changed)
        {
            this._texture.dispose();
            this._texture = null;  // trigger texture reload
        }

        if(ins.dirty.changed || ins.imageIndex.changed)
        {
            const scene = this.getGraphComponent(CVScene);
            scene.models.forEach(model => {
                model.object3D.traverse(object => {
                    const material = object["material"] as UberPBRMaterial;
                    if (material && material.isUberPBRMaterial) { 
                        // currently only doing env reflection if we have a rougness or metalness map defined
                        if(material.roughnessMap || material.metalnessMap) {  
                            if(this._texture === null) {
                                this.assetReader.getTexture("../../images/"+images[ins.imageIndex.value]).then(texture => {
                                    this._texture = texture; 
                                    this._texture.mapping = THREE.EquirectangularReflectionMapping; 
                                    material.envMap = this._texture;
                                    material.needsUpdate = true; 
                                });
                            }
                            else {
                                material.envMap = this._texture;
                                material.envMap.mapping = THREE.EquirectangularReflectionMapping;
                                material.needsUpdate = true; 
                            }
                        }
                    } 
                });
            });
        }

        return true;
    }

    /*fromDocument(document: IDocument, node: INode | IScene): number
    {
        
    }

    toDocument(document: IDocument, node: INode | IScene): number
    {
        
    }*/


}