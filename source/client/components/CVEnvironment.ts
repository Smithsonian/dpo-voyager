/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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

import { Texture, EquirectangularReflectionMapping, SRGBColorSpace, PMREMGenerator, Euler } from "three";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

import Component, { types } from "@ff/graph/Component";
import CVAssetReader from "./CVAssetReader";
import CVScene from "./CVScene";
import UberPBRMaterial from "../shaders/UberPBRMaterial";
import { IEnvironment } from "client/schema/setup";
import UberPBRAdvMaterial from "client/shaders/UberPBRAdvMaterial";
import CScene from "client/../../libs/ff-scene/source/components/CScene";
import CRenderer from "@ff/scene/components/CRenderer";
import { DEG2RAD } from "three/src/math/MathUtils";

const images = ["spruit_sunrise_1k_HDR.hdr","Two Umbrellas For Charts.hdr","Footprint_Court_1k_TMap.jpg", "spruit_sunrise_1k_LDR.jpg","campbell_env.jpg"];  

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

    private _texture: Texture = null;
    private _currentIdx = 0;
    private _pmremGenerator: PMREMGenerator = null;
    private _hdriLoader: RGBELoader = null;

    protected shouldUseEnvMap = false;

    protected get assetReader() {
        return this.getMainComponent(CVAssetReader);
    }
    protected get sceneNode() {
        return this.getSystemComponent(CScene);
    }
    protected get renderer(){
        return this.getSystemComponent(CRenderer);
    }

    create()
    {
        super.create();
        console.log(JSON.stringify(this.node.system.components));
        this._hdriLoader = new RGBELoader();
    }

    dispose()
    {
        this._pmremGenerator ? this._pmremGenerator.dispose() : null;
        super.dispose();
    }

    update()
    {
        const ins = this.ins;
        const scene = this.getGraphComponent(CVScene);

        if(ins.dirty.changed)
        {
            // currently only doing env reflection if we have a rougness or metalness map defined
            this.shouldUseEnvMap = true;
            ins.imageIndex.set();
            /*scene.models.forEach(model => {
                model.object3D.traverse(object => {
                    const material = object["material"] as UberPBRMaterial | UberPBRAdvMaterial;
                    if(material && material.isUberPBRMaterial && (material.roughnessMap || material.metalnessMap)) {
                        this.shouldUseEnvMap = true;

                        if(this._texture !== null) 
                        {
                            this._texture.dispose(); 
                            this._texture = null;   
                        }
                        ins.imageIndex.set();
                    }
                });
            });*/
        }
        if(ins.imageIndex.changed && this.shouldUseEnvMap)
        {
            if(ins.imageIndex.value != this._currentIdx || this._texture === null) 
            {
                if(this._texture !== null) 
                {
                    this._texture.dispose();   
                }

                const mapName = images[ins.imageIndex.value];
                if(mapName.endsWith(".hdr")) {
                    if(this._pmremGenerator === null) {
                        this._pmremGenerator = new PMREMGenerator(this.renderer.views[0].renderer); 
                    }
                    this._hdriLoader.load( "images/"+mapName, (texture) => {
                        this._texture = this._pmremGenerator.fromEquirectangular(texture).texture;
                        texture.dispose(); 
                        this.sceneNode.scene.environment = this._texture;
                        //this.sceneNode.scene.environmentRotation = new Euler(0, 90*DEG2RAD, 0);
                        this.renderer.forceRender();
                    });
                }
                else {
                    this.assetReader.getSystemTexture("images/"+mapName).then(texture => {
                        if(this.node) { 
                            this._texture = texture; 
                            this._texture.mapping = EquirectangularReflectionMapping;
                            //this._texture.colorSpace = SRGBColorSpace;
                            this.sceneNode.scene.environment = this._texture;
                        }
                    });
                }
                this._currentIdx = ins.imageIndex.value;
            }
        }

        return true;
    }

    fromData(data: IEnvironment)
    {
        this.ins.copyValues({
            imageIndex: data.index
        });
    }

    toData(): IEnvironment
    {
        const ins = this.ins;

        return {
            index: ins.imageIndex.cloneValue()
        };
    }
}