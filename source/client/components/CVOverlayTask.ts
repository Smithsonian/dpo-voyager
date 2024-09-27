/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import { Node } from "@ff/graph/Component";
import { IPointerEvent } from "@ff/scene/RenderView";
import CRenderer from "@ff/scene/components/CRenderer";
import Notification from "@ff/ui/Notification";
import convert from "@ff/browser/convert";
import { Dictionary } from "@ff/core/types";

import CVTask, { types } from "./CVTask";
import OverlayTaskView from "../ui/story/OverlayTaskView";

import CVModel2 from "./CVModel2";
import CVAssetManager from "./CVAssetManager";

import NVNode from "../nodes/NVNode";
import {Vector2, CanvasTexture, Mesh} from 'three';
import VGPUPicker from "../utils/VGPUPicker";
import { EDerivativeQuality, EDerivativeUsage, EAssetType, EMapType } from "client/schema/model";
import UberPBRMaterial from "client/shaders/UberPBRMaterial";
import UberPBRAdvMaterial from "client/shaders/UberPBRAdvMaterial";
import CVAssetReader from "./CVAssetReader";
import CVStandaloneFileManager from "./CVStandaloneFileManager";

////////////////////////////////////////////////////////////////////////////////

export interface IGLTFIndexMapExtension
{
    blendFactor: number;
    indexTexture: number;
}

export interface IGLTFExportOptions
{
    binary: boolean;
    includeCustomExtensions: boolean;
} 

export enum EPaintMode { Interact, Paint, Erase };

export default class CVOverlayTask extends CVTask
{
    static readonly typeName: string = "CVOverlayTask";

    static readonly text: string = "Overlay";
    static readonly icon: string = "brush";

    protected static readonly ins = {
        activeNode: types.String("Targets.ActiveNode"),
        activeIndex: types.Integer("Overlay.Index", -1), 
        createOverlay: types.Event("Overlay.Create"),
        deleteOverlay: types.Event("Overlay.Delete"),
        saveOverlays: types.Event("Overlay.Save"),
        overlayFill: types.Event("Overlay.Fill"),
        overlayClear: types.Event("Overlay.Clear"),
        overlayOpacity: types.Percent("Overlay.Opacity", 1.0),
        overlayColor: types.ColorRGB("Overlay.Color", [1.0, 0.0, 0.0]),
        overlayBrushSize: types.Unit("Overlay.BrushSize", {preset: 10, min: 1, max: 100}),
        paintMode: types.Enum("Paint.Mode", EPaintMode, EPaintMode.Interact)
    };

    protected static readonly outs = {
    };

    ins = this.addInputs<CVTask, typeof CVOverlayTask.ins>(CVOverlayTask.ins);
    outs = this.addOutputs<CVTask, typeof CVOverlayTask.outs>(CVOverlayTask.outs);

    isPainting: boolean = false;

    //protected qualities: EDerivativeQuality[] = [EDerivativeQuality.Low, EDerivativeQuality.Medium, EDerivativeQuality.High];
    
    protected ctx: CanvasRenderingContext2D;
    protected activeModel: CVModel2;
    protected picker: VGPUPicker;
    protected uv: Vector2;

    private _oldColor: number[] = [1.0, 0.0, 0.0];
    private _canvasMap: Dictionary<HTMLCanvasElement> = {};
    private _textureMap: Dictionary<CanvasTexture> = {};

    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }
    protected get assetReader() {
        return this.getMainComponent(CVAssetReader);
    }

    get material() {
        let mat = null;
        if(this,this.activeModel.object3D.type === "Mesh") {
            const mesh = this.activeModel.object3D as Mesh;
            mat = mesh.material as UberPBRMaterial | UberPBRAdvMaterial;
        }
        else {
            const mesh = this.activeModel.object3D.getObjectByProperty("type", "Mesh") as Mesh;
            if(mesh) {
                mat = mesh.material as UberPBRMaterial | UberPBRAdvMaterial;
            }
        }
        return mat;
    }

    get overlays() {
        return this.activeModel ? this.activeModel.getOverlays() : null;
    }

    getCanvas(key: string) {
        return this._canvasMap[key] ? this._canvasMap[key] : this._canvasMap[key] = this.createZoneCanvas();
    }

    get activeCanvas() {
        const idx = this.ins.activeIndex.value;
        const key = this.overlays[idx].asset.data.uri;
        return idx >= 0 ? this.getCanvas(key) : null;
    }

    getTexture(key: string) {
        const idx = this.ins.activeIndex.value;
        const overlay = this.overlays[idx];

        // replace Texture from file with CanvasTexture
        if(overlay.fromFile) {
            overlay.fromFile = false;
            overlay.texture.dispose();
            overlay.texture = new CanvasTexture(this.getCanvas(key));
            overlay.texture.flipY = false;
        }
        
        if(!overlay.texture) {
            overlay.texture = new CanvasTexture(this.getCanvas(key));
            overlay.texture.flipY = false;
        }

        return overlay.texture;
    }
    setTexture(key: string, texture: CanvasTexture) {
        this._textureMap[key] = texture;
    }

    get activeTexture() {
        const idx = this.ins.activeIndex.value;
        return idx >= 0 ? this.getTexture(this.overlays[idx].asset.data.uri) : null;
    }

    get colorString() {
        return "#" + Math.round(this.ins.overlayColor.value[0]*255).toString(16).padStart(2, '0') + Math.round(this.ins.overlayColor.value[1]*255).toString(16).padStart(2, '0') 
        + Math.round(this.ins.overlayColor.value[2]*255).toString(16).padStart(2, '0') + Math.round(this.ins.overlayOpacity.value*255).toString(16).padStart(2, '0');
    }

    constructor(node: Node, id: string)
    {
        super(node, id);

        const configuration = this.configuration;
        configuration.bracketsVisible = true;

        this.uv = new Vector2();  
    }

    create()
    {
        super.create();
        this.startObserving();
    }

    dispose()
    {
        this.stopObserving();

        for (let key in this._canvasMap) {
            this._canvasMap[key] = null;
        }

        super.dispose();
    }

    update(context)
    {
        const ins = this.ins;
        const idx = this.ins.activeIndex.value;
        const overlays = this.overlays;
        const model = this.activeModel;

        if (!overlays) {
            return false;
        }

        const overlay = overlays[idx];

        if(ins.activeIndex.changed) {
            if(overlay && overlay.fromFile && !overlay.texture) {
                // load texture from file if not done yet
                this.assetReader.getTexture(overlay.asset.data.uri).then((map) => {
                    map.flipY = false;
                    overlay.texture = map;
                    this.material.zoneMap = map;
                    this.onOverlayChange();
                });
            }
            else {
                this.onOverlayChange();
            }
            return true;
        }

        if(ins.createOverlay.changed)
        {     
            const derivative = model.activeDerivative;
            const qualityName = EDerivativeQuality[derivative.data.quality].toLowerCase();
            const newUri = this.getUniqueName(model.node.name, qualityName);
            const newAsset = derivative.createAsset(EAssetType.Image, newUri);
            newAsset.data.mapType = EMapType.Zone;

            // add new overlay
            const newOverlay = model.getOverlay(newUri);
            ins.activeIndex.setValue(this.overlays.length - 1);
            newOverlay.texture = this.getTexture(newUri);
            newOverlay.asset = newAsset;
            this.onSave();
      
            this.onOverlayChange();
            this.emit("update");
            return true;
        }

        if(ins.deleteOverlay.changed)
        {
            this._canvasMap[overlay.asset.data.uri] = null;
            this.activeModel.deleteOverlay(overlay.asset.data.uri);
            this.activeModel.activeDerivative.removeAsset(overlay.asset);
            ins.activeIndex.setValue(-1);

            this.onOverlayChange();
            this.emit("update");
            return true;
        }

        if(ins.saveOverlays.changed)
        {
            this.onSave();
            return true;
        }

        if(ins.overlayColor.changed || ins.overlayOpacity.changed)
        {
            const newColor = this.colorString;
            this.ctx.fillStyle = newColor;
            this.ctx.strokeStyle = newColor;

            /*console.log("color change");
            let pixels = this.ctx.getImageData(0,0,this.overlayCanvas.width,this.overlayCanvas.height);
            for(let i=0; i<pixels.data.length; i+=4) {
                if(pixels.data[i] === (this._oldColor[0] * 255) && pixels.data[i+1] === (this._oldColor[1] * 255) && pixels.data[i+2] === (this._oldColor[2] * 255)) {
                    console.log("change");
                }
            }*/

            this._oldColor = ins.overlayColor.value;
            return true;
        }

        if(ins.paintMode.changed)
        {
            if(ins.paintMode.value == EPaintMode.Paint) {
                this.ctx.globalCompositeOperation="source-over";
            }
            else if(ins.paintMode.value == EPaintMode.Erase) {
                this.ctx.globalCompositeOperation="destination-out";
            }
            return true;
        }

        if(ins.overlayBrushSize.changed)
        {
            this.ctx.lineWidth = Math.round(ins.overlayBrushSize.value);
            return true;
        }

        if(ins.overlayClear.changed)
        {
            this.ctx.globalCompositeOperation="destination-out";
            this.ctx.clearRect(0,0, this.activeCanvas.width, this.activeCanvas.height);
            this.ctx.globalCompositeOperation="source-over";
            //this.ctx.fillStyle = this.colorString;
            this.updateOverlayTexture();
            this.setSaveNeeded(true);
            return true;
        }

        if(ins.overlayFill.changed)
        {
            this.ctx.clearRect(0,0, this.activeCanvas.width, this.activeCanvas.height);
            this.ctx.fillRect(0,0, this.activeCanvas.width, this.activeCanvas.height);
            this.updateOverlayTexture();
            this.setSaveNeeded(true);
            return true;
        }

        return true;
    }

    createView()
    {
        return new OverlayTaskView(this);
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        if(previous && previous.model)
        {
            previous.model.off<IPointerEvent>("pointer-up", this.onPointerUp, this);
            previous.model.off<IPointerEvent>("pointer-down", this.onPointerDown, this);
            previous.model.off<IPointerEvent>("pointer-move", this.onPointerMove, this);           
            previous.model.outs.quality.off("value", this.onQualityChange, this);
            previous.model.outs.overlayMap.off("value", this.onUpdateIdx, this);
        }

        if(next && next.model)
        {
            this.ins.activeNode.setValue(next.name); 
            this.activeModel = next.model;
            this.onUpdateIdx();

            next.model.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
            next.model.on<IPointerEvent>("pointer-down", this.onPointerDown, this);
            next.model.on<IPointerEvent>("pointer-move", this.onPointerMove, this);

            next.model.outs.quality.on("value", this.onQualityChange, this);
            next.model.outs.overlayMap.on("value", this.onUpdateIdx, this);

            // load overlays
            const overlayProp = this.activeModel.ins.overlayMap;
            overlayProp.setOptions(["None"]);
            this.activeModel.activeDerivative.findAssets(EAssetType.Image).filter(image => image.data.mapType === EMapType.Zone).forEach(image => {
                overlayProp.setOptions(overlayProp.schema.options.concat(image.data.uri));
            });
        }

        super.onActiveNode(previous, next);
    }

    protected onOverlayChange()
    {
        const idx = this.ins.activeIndex.value + 1;
        const isShowing = idx > 0;

        if(this.activeModel.ins.overlayMap.value != idx) {
            this.activeModel.ins.overlayMap.setValue(idx);
        }

        if(isShowing) {
            const compOp = this.ctx ? this.ctx.globalCompositeOperation : "source-over";
            this.ctx = this.activeCanvas.getContext('2d');
            this.ctx.lineWidth = Math.round(this.ins.overlayBrushSize.value);
            this.ctx.fillStyle = this.colorString;
            this.ctx.globalCompositeOperation = compOp;    
        }
        
        if(this.material) {
            this.material.zoneMap = this.activeTexture;
            this.material.transparent = isShowing;
            this.material.enableZoneMap(isShowing);
        }

        if(this.activeTexture) {
            this.updateOverlayTexture();
        }
    }

    protected onUpdateIdx()
    {
        const idx = this.activeModel.ins.overlayMap.value - 1;
        this.ins.activeIndex.setValue(idx);
    }

    protected onQualityChange()
    {
        this.ins.activeIndex.setValue(-1);
    }

    protected updateOverlayTexture() {
        this.activeTexture.needsUpdate = true; 
        this.system.getComponent(CRenderer).forceRender();
    }

    protected onPointerDown(event: IPointerEvent)
    {
        // do not handle event if user is dragging or task is not active
        if (event.isDragging || !this.outs.isActive.value) {
            return;
        }

        // do not handle if overlay not selected
        if(this.ins.activeIndex.value < 0) {
            return;
        }

        if(!this.picker) {
            this.picker = new VGPUPicker(event.view.renderer);
        }

        const model = this.activeModel;
        // if user left-clicked on model in paint or erase mode
        if (this.ins.paintMode.value != EPaintMode.Interact && event.component === model && event.originalEvent.button == 0) {
            event.stopPropagation = true;
            VGPUPicker.add(model.object3D, true);
            this.isPainting = true;
            this.draw(event);
        }
    }

    protected onPointerUp(event: IPointerEvent)
    {
        if(this.isPainting) {
            this.setSaveNeeded(true);
        }

        this.isPainting = false;
    }

    protected onPointerMove(event: IPointerEvent)
    {
        if (event.isDragging && this.isPainting) {
            event.stopPropagation = true;
            this.draw(event);

            return;
        }
    }

    protected draw(event: IPointerEvent)
    {
        const sceneComponent = this.system.getComponent(CRenderer, true).activeSceneComponent;
        const scene = sceneComponent && sceneComponent.scene;
        const camera = sceneComponent && sceneComponent.activeCamera;

        let shaderUVs = this.picker.pickUV(scene, camera, event);
        this.uv.setX(shaderUVs.x);
        this.uv.setY(shaderUVs.y);
        this.activeTexture.transformUv( this.uv );

        const brushWidth = Math.round(this.ins.overlayBrushSize.value);

        const width = Math.floor(this.uv.x*this.activeCanvas.width)-Math.floor(brushWidth/2);
        const height = Math.floor(this.uv.y*this.activeCanvas.height)-Math.floor(brushWidth/2);
        this.ctx.clearRect(width, height, brushWidth, brushWidth);
        this.ctx.fillRect(width, height, brushWidth, brushWidth);
        this.updateOverlayTexture();
    }

    protected createZoneCanvas()
    {   
        const material = this.material;
        const dim = material.map ? material.map.image.width : 4096;  // TODO: Adapt to better size maps for models w/o diffuse

        const canvas  = document.createElement('canvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        canvas.width = dim;
        canvas.height = dim;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.objectFit = "scale-down";
        canvas.style.boxSizing = "border-box";
        canvas.style.position = "absolute";
        canvas.style.zIndex = "2";
        canvas.style.setProperty("mix-blend-mode", "multiply");
        ctx.lineWidth = 10;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "#FFFFFF00";
        ctx.strokeStyle = '#FF000000'

        ctx.fillRect(0,0,dim,dim);

        // if we have a pre-loaded overlay texture we need to copy the image
        if(this.overlays[this.ins.activeIndex.value].fromFile) {
            const map = this.overlays[this.ins.activeIndex.value].texture;
            ctx.save();
            ctx.drawImage(map.image,0,0);
            ctx.restore();
        }

        return canvas;
    }

    protected onSave() 
    {
        const currentCanvas = this.activeCanvas;
        const model = this.activeModel;
        const derivative = model.activeDerivative;
        const quality = derivative.data.quality;

        const imageName = this.overlays[this.ins.activeIndex.value].asset.data.uri;

        const mimeType = imageName.endsWith(".png") ? "image/png" : "image/jpeg";
        const dataURI = currentCanvas.toDataURL(mimeType);
        this.saveTexture(imageName, dataURI, quality);
    }

    protected saveTexture(filePath: string, uri: string, quality: EDerivativeQuality) 
    {

        const fileURL = this.assetManager.getAssetUrl(filePath);
        const fileName = this.assetManager.getAssetName(filePath);
        const blob = convert.dataURItoBlob(uri);
        const file = new File([blob], fileName);
        const standaloneFM = this.graph.getMainComponent(CVStandaloneFileManager, true);

        if(standaloneFM) {
            standaloneFM.addFile(filePath, [blob]);
            new Notification(`Saved ${fileName} to scene package.`, "info", 4000);    
        }
        else {
            fetch(fileURL, {
                method:"PUT",
                body: file,
            })
            .then(() => {
                this.setSaveNeeded(false);
                //this.updateImageMeta(quality, this._mimeType, filePath);
                new Notification(`Successfully uploaded image to '${fileURL}'`, "info", 4000);
            })
            .catch(e => {
                new Notification(`Failed to upload image to '${fileURL}'`, "error", 8000);
            });
        }
    }

    protected setSaveNeeded(isDirty: boolean) 
    {
        const activeOverlay = this.overlays[this.ins.activeIndex.value];
        activeOverlay.isDirty = isDirty;
        this.emit("update");
    }

    protected getUniqueName(name: string, quality: string) : string
    {
        var newName = name + "-overlaymap-" + (this.overlays.length+1) + "-" + quality + ".png";
        var count = 2;
        while(this.overlays.some(overlay => {
            return overlay.asset.data.uri == newName;
        }))
        {
            newName = name + "-overlaymap-" + (this.overlays.length+count) + "-" + quality + ".png";
            count++;
        }

        return newName;
    }
}