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

import CVTask, { types } from "./CVTask";
import OverlayTaskView from "../ui/story/OverlayTaskView";

import CVDocument from "./CVDocument";
import CVModel2 from "./CVModel2";
import CVAssetManager from "./CVAssetManager";

import NVNode from "../nodes/NVNode";
import {Vector2, Raycaster, Scene, CanvasTexture, Mesh, Texture} from 'three';
import VGPUPicker from "../utils/VGPUPicker";
import { EDerivativeQuality, EDerivativeUsage, EAssetType, EMapType } from "client/schema/model";
import UberPBRMaterial from "client/shaders/UberPBRMaterial";
import UberPBRAdvMaterial from "client/shaders/UberPBRAdvMaterial";
import { IAsset } from "client/models/Asset";
import { Dictionary } from "@ff/core/types";

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

/**
 * Describes an overlay image
 */
export interface IOverlay
{
    canvas: HTMLCanvasElement;
    texture: Texture;
    asset: IAsset;
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
        overlayTitle: types.String("Overlay.Title"),
        overlayColor: types.ColorRGB("Overlay.Color", [1.0, 0.0, 0.0]),
        overlayBrushSize: types.Unit("Overlay.BrushSize", {preset: 10, min: 1, max: 100}),
        paintMode: types.Enum("Paint.Mode", EPaintMode, EPaintMode.Interact)
    };

    protected static readonly outs = {
    };

    ins = this.addInputs<CVTask, typeof CVOverlayTask.ins>(CVOverlayTask.ins);
    outs = this.addOutputs<CVTask, typeof CVOverlayTask.outs>(CVOverlayTask.outs);

    isPainting: boolean = false;

    protected overlayScene: Scene;
    protected qualities: EDerivativeQuality[] = [EDerivativeQuality.Low, EDerivativeQuality.Medium, EDerivativeQuality.High];
    

    protected onClickPosition: Vector2;
    protected raycaster: Raycaster;
    protected ctx: CanvasRenderingContext2D;
    protected activeModel: CVModel2;
    protected picker: VGPUPicker;
    protected uv: Vector2;

    private _oldColor: number[] = [1.0, 0.0, 0.0];
    private _overlayDisplayCount: number = 0;
    private _baseCanvas: HTMLCanvasElement = null;
    private _canvasMap: Dictionary<HTMLCanvasElement> = {};
    private _textureMap: Dictionary<CanvasTexture> = {};

    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
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
        const key = this.overlays[idx].asset.uri;
        return idx >= 0 ? this.getCanvas(key) : null;
    }

    getTexture(key: string) {
        return this._textureMap[key] ? this._textureMap[key] : this._textureMap[key] = new CanvasTexture(this.getCanvas(key));
    }
    setTexture(key: string, texture: CanvasTexture) {
        this._textureMap[key] = texture;
    }

    get activeTexture() {
        const idx = this.ins.activeIndex.value;
        const key = this.overlays[idx].asset.uri;
        return idx >= 0 ? this.getTexture(key) : null;
    }

    get baseCanvas() {
        return this._baseCanvas ? this._baseCanvas : this._baseCanvas = this.createBaseCanvas();
    }

    get colorString() {
        return "#" + Math.round(this.ins.overlayColor.value[0]*255).toString(16).padStart(2, '0') + Math.round(this.ins.overlayColor.value[1]*255).toString(16).padStart(2, '0') + Math.round(this.ins.overlayColor.value[2]*255).toString(16).padStart(2, '0') + "FF";
    }

    constructor(node: Node, id: string)
    {
        super(node, id);

        const configuration = this.configuration;
        configuration.bracketsVisible = false;

        this.overlayScene = new Scene();
        this.onClickPosition = new Vector2();
        this.raycaster = new Raycaster();
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
        super.dispose();
    }

    update(context)
    {
        const ins = this.ins;
        const idx = this.ins.activeIndex.value;
        const overlays = this.overlays;

        if (!overlays) {
            return false;
        }

        const overlay = overlays[idx];

        if (overlay) {
            //if(ins.overlayTitle.changed) {
            //    target.title = ins.overlayTitle.value;
            //}
        }

        if(ins.activeIndex.changed) {
            this.onOverlayChange();
            return true;
        }

        if(ins.createOverlay.changed)
        {  
            const model = this.activeModel;
            const derivative = model.activeDerivative;
            const qualityName = EDerivativeQuality[derivative.data.quality].toLowerCase();
            const newUri = model.node.name + "-overlaymap-" + this._overlayDisplayCount++ + "-" + qualityName + ".jpg";
            const newAsset = derivative.createAsset(EAssetType.Image, newUri);
            newAsset.data.mapType = EMapType.Zone;
            this.material.zoneMap = null;

            // add new overlay
            const newOverlay = model.getOverlay(newUri);
            newOverlay.canvas = this.getCanvas(newUri);
            newOverlay.texture = this.getTexture(newUri);
            newOverlay.asset = newAsset.data;

            ins.activeIndex.setValue(overlays.length - 1);

            this.onSave();
      
            this.onOverlayChange();
            this.emit("update");
            return true;
        }

        if(ins.deleteOverlay.changed)
        {
            overlays.splice(idx, 1);
            ins.activeIndex.setValue(-1);

            this.emit("update");
            return true;
        }

        if(ins.saveOverlays.changed)
        {
            this.onSave();
            return true;
        }

        if(ins.overlayColor.changed)
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
                const newColor = this.colorString;
                this.ctx.fillStyle = newColor;
                this.ctx.strokeStyle = newColor;
            }
            else if(ins.paintMode.value == EPaintMode.Erase) {
                this.ctx.fillStyle = "#000000FF";
                this.ctx.strokeStyle = "#000000FF";
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
            this.ctx.fillStyle = "#000000FF";
            this.ctx.fillRect(0,0, this.activeCanvas.width, this.activeCanvas.height);
            this.ctx.fillStyle = this.colorString;
            this.updateOverlayTexture();
            return true;
        }

        if(ins.overlayFill.changed)
        {
            this.ctx.fillRect(0,0, this.activeCanvas.width, this.activeCanvas.height);
            this.updateOverlayTexture();
            return true;
        }

        return true;
    }

    createView()
    {
        return new OverlayTaskView(this);
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            
        }
        if (next) {
            if (this.isActiveTask) {
                //this.targets.ins.enabled.setValue(true);
            }
        }

        this.changed = true;
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        if(previous && previous.model)
        {
            previous.model.off<IPointerEvent>("pointer-up", this.onPointerUp, this);
            previous.model.off<IPointerEvent>("pointer-down", this.onPointerDown, this);
            previous.model.off<IPointerEvent>("pointer-move", this.onPointerMove, this);           
            previous.model.outs.quality.off("value", this.onQualityChange, this);
        }

        if(next && next.model)
        {
            this.ins.activeNode.setValue(next.name); 
            this.activeModel = next.model;

            this.overlays.forEach(overlay => {
                overlay.canvas = this.getCanvas(overlay.asset.uri);
                overlay.texture = this.getTexture(overlay.asset.uri);
            });

            next.model.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
            next.model.on<IPointerEvent>("pointer-down", this.onPointerDown, this);
            next.model.on<IPointerEvent>("pointer-move", this.onPointerMove, this);

            next.model.outs.quality.on("value", this.onQualityChange, this);

            if(this.material.map) {
                const baseCtx = this.baseCanvas.getContext('2d');
                baseCtx.save();
                baseCtx.scale(1, -1);
                baseCtx.drawImage(this.material.map.image,0,-this.material.map.image.height);
                baseCtx.restore();
            }

            //this.onOverlayChange();
        }

        super.onActiveNode(previous, next);
    }

    protected onOverlayChange()
    {
        if(this.ins.activeIndex.value >= 0) {
            this.ctx = this.activeCanvas.getContext('2d');
            this.ctx.lineWidth = Math.round(this.ins.overlayBrushSize.value);
            this.ctx.fillStyle = this.colorString;

            this.material.zoneMap = this.activeTexture;
            this.material.transparent = true;

            this.updateOverlayTexture();
        }
    }

    protected onQualityChange()
    {
        const currentCanvas = this.activeCanvas;
        const currentCtx = currentCanvas.getContext('2d');
        const lineWidth = currentCtx.lineWidth;

        // get new image size
        const derivative = this.activeModel.derivatives.select(EDerivativeUsage.Web3D, this.activeModel.outs.quality.value);
        const asset = derivative.findAsset(EAssetType.Model);
        const imageSize = asset.data.imageSize;

        // copy image to temp canvas
        const tempCanvas = document.createElement('canvas') as HTMLCanvasElement;
        tempCanvas.height = currentCanvas.height;
        tempCanvas.width = currentCanvas.width;
        tempCanvas.getContext('2d').drawImage(currentCanvas,0,0);

        // resize canvas and redraw
        currentCanvas.height = imageSize;
        currentCanvas.width = imageSize;
        currentCtx.lineWidth = lineWidth;
        currentCtx.lineJoin = "round";
        currentCtx.lineCap = "round";
        currentCtx.fillStyle = this.ctx.fillStyle;
        currentCtx.strokeStyle = this.ctx.strokeStyle;
        currentCtx.drawImage(tempCanvas,0,0,tempCanvas.width,tempCanvas.height,0,0,imageSize,imageSize);

        // refresh target texture
        //this.overlayTexture = null;
        //const refresh = this.overlayTexture;
        this.activeTexture.needsUpdate = true;
    }

    updateOverlayTexture() {
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
        //if(!this.targets.activeTarget || this.targets.activeTarget.type != "Overlay") {
        //    return;
        //}

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

        const brushWidth = this.ins.overlayBrushSize.value;
        this.ctx.fillRect(Math.floor(this.uv.x*this.activeCanvas.width)-(brushWidth/2), Math.floor(this.uv.y*this.activeCanvas.height)-(brushWidth/2), brushWidth, brushWidth);
        this.updateOverlayTexture();
    }


    protected createBaseCanvas()
    {
        const material = this.material;
        const dim = material && material.map ? material.map.image.width : 4096;
        let canvas = document.createElement('canvas') as HTMLCanvasElement;
        canvas.width = dim;
        canvas.height = dim;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.objectFit = "scale-down";
        canvas.style.boxSizing = "border-box";
        canvas.style.position = "absolute";
        canvas.style.zIndex = "1";

        return canvas;
    }

    protected createZoneCanvas()
    {   
        const material = this.material;
        const dim = material.map ? material.map.image.width : 4096;

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

        // if we have a pre-loaded zone texture we need to copy the image
        if(material.zoneMap && !material.zoneMap.isCanvasTexture) {
            ctx.save();
            ctx.scale(1, -1);
            //baseCtx.drawImage(this.material.map.image,0,-this.material.map.image.height);
            ctx.drawImage(material.zoneMap.image,0,-material.zoneMap.image.height);
            ctx.restore();
        }

        return canvas;
    }

    protected onSave() {
        const currentCanvas = this.activeCanvas;
        const model = this.activeModel;

        const tempCanvas = document.createElement('canvas') as HTMLCanvasElement;

        if(this.activeTexture) {  // TODO: always true, need to change
            const derivative = model.activeDerivative;
            const quality = derivative.data.quality;

            const asset = derivative.findAsset(EAssetType.Model);
            const imageSize : number = +asset.data.imageSize;
            const imageName = this.overlays[this.ins.activeIndex.value].asset.uri;

            // generate image data at correct resolution for this derivative
            tempCanvas.width = imageSize;
            tempCanvas.height = imageSize;

            tempCanvas.getContext('2d').scale(1, -1); // need to invert Y
            tempCanvas.getContext('2d').drawImage(currentCanvas,0,0,currentCanvas.width,currentCanvas.height,0,0,imageSize,imageSize * -1);

            const dataURI = tempCanvas.toDataURL("image/jpeg");
            this.saveTexture(imageName, dataURI, quality);
        }
    }

    protected saveTexture(baseName: string, uri: string, quality: EDerivativeQuality) {

        const fileURL = this.assetManager.getAssetUrl(baseName);
        const fileName = this.assetManager.getAssetName(baseName);
        const blob = convert.dataURItoBlob(uri);
        const file = new File([blob], fileName);

        fetch(fileURL, {
            method:"PUT",
            body: file,
        })
        .then(() => {
            //this.updateImageMeta(quality, this._mimeType, filePath);
            new Notification(`Successfully uploaded image to '${fileURL}'`, "info", 4000);
        })
        .catch(e => {
            new Notification(`Failed to upload image to '${fileURL}'`, "error", 8000);
        });
    }
}