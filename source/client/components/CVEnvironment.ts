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

import { Texture, EquirectangularReflectionMapping, SRGBColorSpace, PMREMGenerator, Euler, MeshStandardMaterial } from "three";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

import Component, { types } from "@ff/graph/Component";
import CVAssetReader from "./CVAssetReader";
import CVScene from "./CVScene";
import { IEnvironment } from "client/schema/setup";
import CScene from "client/../../libs/ff-scene/source/components/CScene";
import CRenderer from "@ff/scene/components/CRenderer";
import { DEG2RAD } from "three/src/math/MathUtils";
import CVBackground from "./CVBackground";

const images = ["spruit_sunrise_1k_HDR.hdr","Two Umbrellas For Charts.hdr","Footprint_Court_1k_TMap.jpg", "spruit_sunrise_1k_LDR.jpg","campbell_env.jpg"];  

////////////////////////////////////////////////////////////////////////////////

const _euler = new Euler();

export default class CVEnvironment extends Component
{
    static readonly typeName: string = "CVEnvironment";
    static readonly text: string = "Environment";

    protected static readonly envIns = {
        imageIndex: types.Integer("Environment.Index", { preset: 0, options: images.map( function(item, index) {return index.toString();}) }),
        dirty: types.Event("Environment.Dirty"),
        intensity: types.Number("Environment.Intensity", {preset:1, min: 0,}),
        rotation: types.Vector3("Environment.Rotation"),
        visible: types.Boolean("Environment.Visible", false)
    };

    ins = this.addInputs(CVEnvironment.envIns);

    get settingProperties() {
        return [
            this.ins.intensity,
            this.ins.rotation,
            this.ins.visible
        ];
    }

    private _texture: Texture = null;
    private _currentIdx = 0;
    private _pmremGenerator: PMREMGenerator = null;
    private _hdriLoader: RGBELoader = null;

    protected shouldUseEnvMap = false;

    protected get assetReader() {
        return this.getMainComponent(CVAssetReader);
    }
    protected get background() {
        return this.getSystemComponent(CVBackground);
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
                    const material = object["material"] as MeshStandardMaterial;
                    if(material && (material.roughnessMap || material.metalnessMap)) {
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
        if(ins.imageIndex.changed)
        {
            if(ins.imageIndex.value != this._currentIdx || this._texture === null) 
            {
                if(this._texture !== null) 
                {
                    this._texture.dispose();   
                }
                if(this._pmremGenerator === null) {
                    this._pmremGenerator = new PMREMGenerator(this.renderer.views[0].renderer); 
                }

                const mapName = images[ins.imageIndex.value];
                if(mapName.endsWith(".hdr")) {
                    this._hdriLoader.load( "images/"+mapName, (texture) => {
                        this.updateEnvironmentMap(texture);
                    });
                }
                else {
                    this.assetReader.getSystemTexture("images/"+mapName).then(texture => {
                        this.updateEnvironmentMap(texture);
                    });
                }
                this._currentIdx = ins.imageIndex.value;
            }
        }
        if(ins.intensity.changed) 
        {
            this.sceneNode.scene.environmentIntensity = ins.intensity.value;
            ins.visible.value ? this.sceneNode.scene.backgroundIntensity = ins.intensity.value : null;
        }
        if(ins.rotation.changed)
        {
            const rot = ins.rotation.value;
            _euler.set(rot[0]*DEG2RAD,rot[1]*DEG2RAD,rot[2]*DEG2RAD); 
        }
        if(ins.visible.changed)
        {
            this.background.ins.visible.setValue(!ins.visible.value);
            this.sceneNode.scene.background = ins.visible.value ? this._texture : null;
            ins.visible.value ? this.sceneNode.scene.background.needsUpdate = true : null;
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

    protected updateEnvironmentMap(texture: Texture)
    {
        const ins = this.ins;

        this._texture = this._pmremGenerator.fromEquirectangular(texture).texture;
        texture.dispose(); 
        this.sceneNode.scene.environment = this._texture;
        this.sceneNode.scene.environmentRotation = _euler;
        this.sceneNode.scene.backgroundRotation = _euler;
        this.renderer.forceRender();
        ins.visible.set();
    }
}