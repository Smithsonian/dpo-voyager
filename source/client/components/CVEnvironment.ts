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
import CVAssetManager from "./CVAssetManager";
import CVAssetReader from "./CVAssetReader";
import { IEnvironment } from "client/schema/setup";
import CScene from "client/../../libs/ff-scene/source/components/CScene";
import CRenderer from "@ff/scene/components/CRenderer";
import { DEG2RAD } from "three/src/math/MathUtils";
import CVBackground from "./CVBackground";
import CVMeta from "./CVMeta";
import CVEnvironmentLight from "./lights/CVEnvironmentLight";
import CVModel2, { IModelLoadEvent } from "./CVModel2";

import Notification from "@ff/ui/Notification";

const images = ["studio_small_08_1k.hdr", "capture_tent_mockup-v2-1k.hdr", "spruit_sunrise_1k_HDR.hdr"];

////////////////////////////////////////////////////////////////////////////////

const _euler = new Euler();

export default class CVEnvironment extends Component
{
    static readonly typeName: string = "CVEnvironment";
    static readonly text: string = "Environment";

    protected static readonly envIns = {
        imageIndex: types.Integer("Environment.Map", { preset: 0, options: images }),
        initialize: types.Event("Environment.Init"),
        uploadMap: types.Event("Environment.Upload"),
        intensity: types.Number("Environment.Intensity", {preset:1, min: 0,}),
        rotation: types.Vector3("Environment.Rotation"),
        visible: types.Boolean("Environment.Visible", false),
        enabled: types.Boolean("Environment.Enabled", true)
    };

    ins = this.addInputs(CVEnvironment.envIns);

    private _target: WebGLRenderTarget = null;
    private _pmremGenerator :PMREMGenerator = null;
    private _currentIdx = 0;
    private _imageOptions: string[] = images.slice();
    private _loadingCount = 0;
    private _isLegacy = false;      // flag if scene is legacy (no loaded env light)
    private _isLegacyRefl = false;  // fkag if scene is legacy and has reflective material

    get settingProperties() {
        return [
            this.ins.intensity,
            this.ins.rotation,
            this.ins.imageIndex,
            this.ins.uploadMap,
            this.ins.visible
        ];
    }

    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }
    protected get assetReader() {
        return this.getMainComponent(CVAssetReader);
    }
    protected get assetWriter() {
        const CVAssetWriter = require("./CVAssetWriter").default;
        return this.getMainComponent(CVAssetWriter);
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
        this.graph.components.on(CVModel2, this.onModelComponent, this);
    }

    dispose()
    {
        this.graph.components.off(CVModel2, this.onModelComponent, this);
        this.system.components.off(CVMeta, this.onMetaComponent, this);
        if(this.sceneNode.scene.environment){
            //Ensure scene does not keep a reference to our texture
            //Because otherwise it would get re-uploaded and possibly leak
            this.sceneNode.scene.environment = null;
        }

        if(this.sceneNode.scene.background) {
            this.sceneNode.scene.background = null;
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

        if(ins.initialize.changed) {
            this._isLegacy = false;
            this._isLegacyRefl = false;
            if(!this.graph.hasComponent(CVEnvironmentLight)) {
                this.addLightComponent(false);
            }
        }

        if(ins.uploadMap.changed) {
            this.uploadEnvironmentMap();
        }

        if(ins.imageIndex.changed && (ins.enabled.value || ins.visible.value))
        {
            this.loadEnvironmentMap();
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
        if(ins.enabled.changed) {
            if(ins.enabled.value) 
            {
                this.loadEnvironmentMap();
            }
            this.sceneNode.scene.environment = ins.enabled.value ? this._target?.texture : null;
        }
        if(ins.visible.changed && this._loadingCount == 0)
        { 
            if(ins.visible.value) 
            {
                this.loadEnvironmentMap();
            }
            this.sceneNode.scene.background = ins.visible.value ? this._target?.texture : null;
            ins.visible.value && this.sceneNode.scene.background ? (this.sceneNode.scene.background as Texture).needsUpdate = true : null;
            this.background.ins.visible.setValue(!ins.visible.value);
        }

        // Optimization to dispose when map is not being used at all
        if(this._target && !ins.enabled.value && !ins.visible.value){
            this._target.dispose();
            this._target = null;
            this.sceneNode.scene.environment = null;
            this.sceneNode.scene.background = null;           
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

    protected loadEnvironmentMap() {
        const ins = this.ins;

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
                    this.updateEnvironmentMap(texture, mapName);
                });
            }
            else {
                this._loadingCount++;
                this.assetReader.getTexture(mapName).then(texture => {
                    this.updateEnvironmentMap(texture, mapName);
                });
            }
            this._currentIdx = ins.imageIndex.value;
        }
    }

    protected updateEnvironmentMap(texture: Texture, name: string)
    {
        const ins = this.ins;
        const mapIdx = this._imageOptions.indexOf(name);

        if(mapIdx == ins.imageIndex.value) {
            this._target = this._pmremGenerator.fromEquirectangular(texture, this._target);
            this.sceneNode.scene.environment = ins.enabled.value ? this._target.texture : null;
            this.sceneNode.scene.background = ins.visible.value ? this._target.texture : null;
            this.sceneNode.scene.environmentRotation = _euler;
            this.sceneNode.scene.backgroundRotation = _euler;
            this.renderer.forceRender();
        }

        texture.dispose();
        texture = null;
        this._loadingCount--;
    }

    private async assetExists(assetPath: string): Promise<boolean> {
        const url = this.assetManager.getAssetUrl(assetPath);
        return fetch(url, { method: "HEAD" })
            .then(response => response.ok)
            .catch(() => {
                console.error(`Failed to check existence of asset at ${url}`);
                return false;
            });
    }
    
    uploadEnvironmentMap() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.hdr,.exr';
        input.onchange = async (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const fileName = file.name;
            const assetPath = `/images/${fileName}`;

            if (await this.assetExists(assetPath)) {
                Notification.show(`Environment map "${fileName}" already exists. Skipping upload.`, "info");
                return;
            }

            const contentType = fileName.endsWith('.hdr') ? 'image/vnd.radiance' : 'image/x-exr';

            this.assetWriter.put(file, contentType, assetPath).then(() => {
                if (!this._imageOptions.includes(assetPath)) {
                    this._imageOptions.push(assetPath);
                }
                this.ins.imageIndex.setOptions(this._imageOptions);

                // Set the new index and let loadEnvironmentMap load from disk
                this.ins.imageIndex.setValue(this._imageOptions.length - 1);
                Notification.show(`Environment map "${fileName}" uploaded successfully.`, "success");
            }).catch((error: any) => {
                console.error('Failed to save environment map:', error);
            });
        }
        input.click();
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
                        this.ins.imageIndex.setOptions(this._imageOptions);
                    }
                });
            });
        }
    }
    
    protected addLightComponent(enabled: boolean) {
        const NVNode = require("client/nodes/NVNode").default;
        const lightNode = this.graph.findNodeByName("Lights") as any;
        const childNode = lightNode.graph.createCustomNode(lightNode) as any;
        const envLight = childNode.transform.createComponent(CVEnvironmentLight);
        envLight.ins.enabled.setValue(enabled);
        lightNode.transform.addChild(childNode.transform);
        this._isLegacy = true;
    }

    protected onModelComponent(event: IComponentEvent<CVModel2>)
    {
        const component = event.object;

        if (event.add) {
            component.on<IModelLoadEvent>("model-load", () => this.legacyCheck(component), this);
        }
        else if (event.remove) {
            component.off<IModelLoadEvent>("model-load", () => this.legacyCheck(component), this);
        }
    }

    protected legacyCheck(model: CVModel2)
    {
        if(!this._isLegacy || this._isLegacyRefl) {
            return;
        }

        // For backwards compatibility, always enable env light if a roughness or metalness map is present 
        model.object3D.traverse(object => {
            const material = object["material"];
            if(material && !this._isLegacyRefl && (material.roughnessMap || material.metalnessMap)) {
                // Hack to make sure UI updates appropriately
                const envLight = this.graph.getComponent(CVEnvironmentLight);
                envLight.transform.dispose();
                
                this.addLightComponent(true);
                this._isLegacyRefl = true;
            }
        });
    }
}