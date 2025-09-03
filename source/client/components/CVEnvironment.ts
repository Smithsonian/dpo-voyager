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

import { PMREMGenerator, WebGLRenderTarget, Texture, Euler } from "three";

import Component, { IComponentEvent, types } from "@ff/graph/Component";
import CVAssetReader from "./CVAssetReader";
import { IEnvironment } from "client/schema/setup";
import CScene from "client/../../libs/ff-scene/source/components/CScene";
import CRenderer from "@ff/scene/components/CRenderer";
import { DEG2RAD } from "three/src/math/MathUtils";
import CVBackground from "./CVBackground";
import CVMeta from "./CVMeta";
import NVNode from "client/nodes/NVNode";
import CVEnvironmentLight from "./lights/CVEnvironmentLight";


const images = ["spruit_sunrise_1k_HDR.hdr","Two Umbrellas For Charts.hdr","studio_small_08_1k.hdr","campbell_env.jpg"];  

////////////////////////////////////////////////////////////////////////////////

const _euler = new Euler();

export default class CVEnvironment extends Component
{
    static readonly typeName: string = "CVEnvironment";
    static readonly text: string = "Environment";

    protected static readonly envIns = {
        imageIndex: types.Integer("Environment.MapIndex", { preset: 0, options: images.map( function(item, index) {return index.toString();}) }),
        dirty: types.Event("Environment.Dirty"),
        intensity: types.Number("Environment.Intensity", {preset:1, min: 0,}),
        rotation: types.Vector3("Environment.Rotation"),
        visible: types.Boolean("Environment.Visible", false),
        enabled: types.Boolean("Environment.Enabled", true)
    };

    ins = this.addInputs(CVEnvironment.envIns);

    private _target: WebGLRenderTarget = null;
    private _pmremGenerator :PMREMGenerator = null;
    private _currentIdx = 0;
    private _imageOptions: string[] = images;
    private _loadingCount = 0;

    get settingProperties() {
        return [
            this.ins.intensity,
            this.ins.rotation,
            this.ins.imageIndex,
            this.ins.visible
        ];
    }

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
        this.system.components.on(CVMeta, this.onMetaComponent, this);
    }

    dispose()
    {
        this.system.components.off(CVMeta, this.onMetaComponent, this);
        if(this.sceneNode.scene.environment){
            //Ensure scene does not keep a reference to our texture
            //Because otherwise it would get re-uploaded and possibly leak
            this.sceneNode.scene.environment = null;
        }

        if(this._target) {
            this._target.texture?.dispose();
            this._target.texture = null;
            this._target.dispose();
            this._target = null;
        }
        this._pmremGenerator?.dispose();
        this._pmremGenerator = null;
        super.dispose();
    }

    update()
    {
        const ins = this.ins;

        if(!this.graph.hasComponent(CVEnvironmentLight)) {
            this.addLightComponent();
        }

        if(ins.enabled.changed) {
            this.sceneNode.scene.environment = ins.enabled.value && ins.imageIndex.value == this._currentIdx ? this._target?.texture : null;
            ins.imageIndex.set();
        }

        if(ins.imageIndex.changed && ins.enabled.value)
        {
            if(ins.imageIndex.value != this._currentIdx || this._target === null) 
            {
                try {
                    if(this._pmremGenerator === null) {
                        let renderer = this.renderer.views[0].renderer;
                        if(!renderer) throw new Error(`No renderer found : can't generate environment`);
                        this._pmremGenerator = new PMREMGenerator(this.renderer.views[0].renderer);
                    }
                }
                catch(e) {
                    console.error("Failed to compile environment map : ", e);
                }

                const mapName = this._imageOptions[ins.imageIndex.value];

                if(images.includes(mapName)) {
                    this._loadingCount++;
                    this.assetReader.getSystemTexture("images/"+mapName).then(texture => {
                        this.updateEnvironmentMap(texture);
                    });
                }
                else {
                    this._loadingCount++;
                    this.assetReader.getTexture(mapName).then(texture => {
                        this.updateEnvironmentMap(texture);
                    });
                }
                this._currentIdx = ins.imageIndex.value;
            }
        }
        else if(this._target && !ins.enabled.value){
            this._target.dispose();
            this._target = null;
            this.sceneNode.scene.environment = null;            
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
        if(ins.visible.changed && this._loadingCount == 0)
        { 
            this.sceneNode.scene.background = ins.visible.value ? this._target.texture : null;
            ins.visible.value && this.sceneNode.scene.background ? this.sceneNode.scene.background.needsUpdate = true : null;
            this.background.ins.visible.setValue(!ins.visible.value);
        }

        return true;
    }

    fromData(data: IEnvironment)
    {
        const ins = this.ins;

        if (data.rotation) {
            ins.rotation.setValue(data.rotation);
        }
        if (data.index) {
            ins.imageIndex.setValue(data.index);
        }
        if (data.visible) {
            ins.visible.setValue(data.visible);
        }
    }

    toData(): IEnvironment
    {
        const ins = this.ins;

        return {
            index: ins.imageIndex.value,
            visible: ins.visible.value,
            rotation: ins.rotation.cloneValue()
        };
    }

    protected updateEnvironmentMap(texture: Texture)
    {
        const ins = this.ins;

        this._target = this._pmremGenerator.fromEquirectangular(texture, this._target);
        texture.dispose();
        texture = null;
        this.sceneNode.scene.environment = this._target.texture;
        this.sceneNode.scene.environmentRotation = _euler;
        this.sceneNode.scene.backgroundRotation = _euler;
        this.renderer.forceRender();
        this._loadingCount--;
        ins.visible.set();
    }

    protected onMetaComponent(event: IComponentEvent<CVMeta>)
    {
        const meta = event.object;

        if (event.add) {
            meta.once("load", () => {
                const images = meta.images.dictionary;
                Object.keys(images).forEach(key => {
                    const image =  images[key];
                    if(image.usage && image.usage === "Environment") {
                        this._imageOptions.push(image.uri);
                        this.ins.imageIndex.setOptions(this._imageOptions.map( function(item, index) {return index.toString();}));
                    }
                });
            });
        }
    }
    
    protected addLightComponent() {
        const lightNode = this.graph.findNodeByName("Lights") as NVNode;
        const childNode = lightNode.graph.createCustomNode(lightNode as NVNode) as NVNode;
        childNode.transform.createComponent(CVEnvironmentLight);
        lightNode.transform.addChild(childNode.transform);
    }
}