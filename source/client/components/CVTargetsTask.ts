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

import { Node } from "@ff/graph/Component";
import { IPointerEvent } from "@ff/scene/RenderView";
import CRenderer from "@ff/scene/components/CRenderer";
import Notification from "@ff/ui/Notification";
import fetch from "@ff/browser/fetch";
import convert from "@ff/browser/convert";

import CVTask, { types } from "./CVTask";
import TargetsTaskView from "../ui/story/TargetsTaskView";

import CVDocument from "./CVDocument";
import CVTargets from "./CVTargets";
import CVSnapshots, { EEasingCurve } from "./CVSnapshots";
import CVTargetManager from "./CVTargetManager";
import CVModel2 from "./CVModel2";
import CVAssetManager from "./CVAssetManager";

import NVNode from "../nodes/NVNode";
import {Vector2, Raycaster, Scene} from 'three';
import VGPUPicker from "../utils/VGPUPicker";
import { EDerivativeQuality, EDerivativeUsage, EAssetType, EMapType } from "client/schema/model";

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

export default class CVTargetsTask extends CVTask
{
    static readonly typeName: string = "CVTargetsTask";

    static readonly text: string = "Targets";
    static readonly icon: string = "target";

    protected static readonly ins = {
        activeNode: types.String("Targets.ActiveNode"),
        updateSnapshot: types.Event("Snapshot.Update"),
        createSnapshot: types.Event("Snapshot.Create"),
        deleteSnapshot: types.Event("Snapshot.Delete"), 
        snapshotTitle: types.String("Snapshot.Title"),
        snapshotCurve: types.Enum("Snapshot.Curve", EEasingCurve),
        snapshotDuration: types.Number("Snapshot.Duration", 1),
        snapshotThreshold: types.Percent("Snapshot.Threshold", 0.5),
        createZone: types.Event("Zone.Create"),
        deleteZone: types.Event("Zone.Delete"),
        saveZones: types.Event("Zone.Save"),
        zoneFill: types.Event("Zone.Fill"),
        zoneClear: types.Event("Zone.Clear"),
        zoneTitle: types.String("Zone.Title"),
        zoneColor: types.ColorRGB("Zone.Color", [1.0, 0.0, 0.0]),
        zoneBrushSize: types.Unit("Zone.BrushSize", {preset: 10, min: 1, max: 100}),
        paintMode: types.Enum("Paint.Mode", EPaintMode, EPaintMode.Interact)
    };

    protected static readonly outs = {
    };

    ins = this.addInputs<CVTask, typeof CVTargetsTask.ins>(CVTargetsTask.ins);
    outs = this.addOutputs<CVTask, typeof CVTargetsTask.outs>(CVTargetsTask.outs);

    targets: CVTargets = null;
    machine: CVSnapshots = null;

    isPainting: boolean = false;

    protected zoneScene: Scene;
    protected qualities: EDerivativeQuality[] = [EDerivativeQuality.Low, EDerivativeQuality.Medium, EDerivativeQuality.High];

    protected onClickPosition: Vector2;
    protected raycaster: Raycaster;
    protected ctx: CanvasRenderingContext2D;
    protected activeModel: CVModel2;
    protected picker: VGPUPicker;
    protected uv: Vector2;

    private _oldColor: number[] = [1.0, 0.0, 0.0];
    private _zoneDisplayCount: number = 0;
    private _baseCanvas: HTMLCanvasElement = null; 

    get manager() {
        return this.getSystemComponent(CVTargetManager, true);
    }

    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }

    get zoneCanvas() {
        return this.targets.zoneCanvas;
    }

    get zoneTexture() {
        return this.targets.zoneTexture;
    }

    get baseCanvas() {
        return this._baseCanvas ? this._baseCanvas : this._baseCanvas = this.createBaseCanvas();
    }

    get colorString() {
        return "#" + Math.round(this.ins.zoneColor.value[0]*255).toString(16).padStart(2, '0') + Math.round(this.ins.zoneColor.value[1]*255).toString(16).padStart(2, '0') + Math.round(this.ins.zoneColor.value[2]*255).toString(16).padStart(2, '0');
    }

    constructor(node: Node, id: string)
    {
        super(node, id);

        const configuration = this.configuration;
        configuration.bracketsVisible = false;

        this.zoneScene = new Scene();
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
        const targets = this.targets;
        const machine = this.machine;

        if (!targets) {
            return false;
        }

        const targetList = targets.targets;
        const targetIndex = targets.outs.targetIndex.value;
        const target = targetList[targetIndex];

        if (target) {
            const snapshotList = target.snapshots;
            const snapshotIndex = targets.outs.snapshotIndex.value;
            const snapshot = snapshotList[snapshotIndex];

            // target snapshot actions
            if (ins.createSnapshot.changed) {
                const id = machine.setState({
                    values: machine.getCurrentValues(),
                    curve: EEasingCurve.EaseOutQuad,
                    duration: 1.5,
                    threshold: 0.5,
                });

                snapshotList.splice(snapshotIndex + 1, 0, {
                    title: "New Snapshot",
                    id
                });

                targets.ins.active.setValue(true);
                targets.ins.snapshotIndex.setValue(snapshotIndex + 1);
                machine.ins.id.setValue(id);
                return true;
            }

            if (snapshot) {
                if (ins.snapshotTitle.changed || ins.snapshotCurve.changed ||
                        ins.snapshotDuration.changed || ins.snapshotThreshold.changed) {
                            snapshot.title = ins.snapshotTitle.value;
                    machine.ins.curve.setValue(ins.snapshotCurve.value);
                    machine.ins.duration.setValue(ins.snapshotDuration.value);
                    machine.ins.threshold.setValue(ins.snapshotThreshold.value);
                    //targets.ins.snapshotIndex.setValue(snapshotIndex); console.log("state id: %s", machine.ins.id.value);
                    return true;
                }

                if (ins.updateSnapshot.changed) {
                    machine.ins.store.set();
                    return true;
                }
                if (ins.deleteSnapshot.changed) {
                    snapshotList.splice(snapshotIndex, 1);
                    machine.ins.delete.set();
                    targets.ins.snapshotIndex.setValue(snapshotIndex);

                    // Update active flag in case we deleted the last snapshot
                    if(!targetList.some(target => target.snapshots.length > 0)) {
                        targets.ins.active.setValue(false); 
                    }

                    return true;
                }
            }

            if(ins.zoneTitle.changed) {
                target.title = ins.zoneTitle.value;
            }
        }

        if(ins.createZone.changed)
        {
            targetList.splice(targetList.length, 0, {
                type: "Zone",
                id: "",
                title: "New Zone " + this._zoneDisplayCount++,
                color: "#" + Math.floor(Math.random()*16777215).toString(16),
                snapshots: []
            });

            targets.ins.targetIndex.setValue(targetList.length - 1);
            this.emit("update");
            return true;
        }

        if(ins.deleteZone.changed)
        {
            targetList.splice(targetIndex, 1);
            targets.ins.targetIndex.setValue(-1);

            // Update active flag in case we deleted the last active target
            if(!targetList.some(target => target.snapshots.length > 0)) {
                targets.ins.active.setValue(false); 
            }

            this.emit("update");
            return true;
        }

        if(ins.saveZones.changed)
        {
            this.onSave();
            return true;
        }

        if(ins.zoneColor.changed)
        {
            const newColor = this.colorString;
            this.ctx.fillStyle = newColor;
            this.ctx.strokeStyle = newColor;
            target.color = newColor;

            /*console.log("color change");
            let pixels = this.ctx.getImageData(0,0,this.zoneCanvas.width,this.zoneCanvas.height);
            for(let i=0; i<pixels.data.length; i+=4) {
                if(pixels.data[i] === (this._oldColor[0] * 255) && pixels.data[i+1] === (this._oldColor[1] * 255) && pixels.data[i+2] === (this._oldColor[2] * 255)) {
                    console.log("change");
                }
            }
            console.log("color changeB");*/

            this._oldColor = ins.zoneColor.value;
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
                this.ctx.fillStyle = "#FFFFFF";
                this.ctx.strokeStyle = "#FFFFFF";
            }
            return true;
        }

        if(ins.zoneBrushSize.changed)
        {
            this.ctx.lineWidth = Math.round(ins.zoneBrushSize.value);
            return true;
        }

        if(ins.zoneClear.changed)
        {
            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.fillRect(0,0, this.zoneCanvas.width, this.zoneCanvas.height);
            this.ctx.fillStyle = this.colorString;
            this.updateZoneTexture();
            return true;
        }

        if(ins.zoneFill.changed)
        {
            this.ctx.fillRect(0,0, this.zoneCanvas.width, this.zoneCanvas.height);
            this.updateZoneTexture();
            return true;
        }

        return true;
    }

    createView()
    {
        return new TargetsTaskView(this);
    }

    activateTask()
    {
        super.activateTask();

        if (this.targets) {
            this.targets.ins.enabled.setValue(true);
        } 

        this.system.getComponents(CVTargets).forEach(targets => targets.ins.visible.setValue(true));
    }

    deactivateTask()
    {
        if (this.targets) {
            this.targets.ins.enabled.setValue(false);
        }

        this.system.getComponents(CVTargets).forEach(targets => targets.ins.visible.setValue(false));

        super.deactivateTask();
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            if (this.isActiveTask) {
                this.targets.ins.enabled.setValue(false);
            }
            
            this.targets = null;
            this.machine = null;
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
        const prevTargets = previous ? previous.getComponent(CVTargets, true) : null;

        if(prevTargets)
        {
            prevTargets.outs.targetIndex.off("value", this.onTargetChange, this);
            prevTargets.outs.snapshotIndex.off("value", this.onSnapshotChange, this);

            this.targets = null;
            this.machine = null;

            if(previous.model)
            {
                previous.model.off<IPointerEvent>("pointer-up", this.onPointerUp, this);
                previous.model.off<IPointerEvent>("pointer-down", this.onPointerDown, this);
                previous.model.off<IPointerEvent>("pointer-move", this.onPointerMove, this);

                previous.model.outs.quality.off("value", this.onQualityChange, this);
            }
        }

        if(next && next.model)
        {
            this.targets = next.getComponent(CVTargets, true);
            this.machine = this.targets.snapshots;
            this.ins.activeNode.setValue(next.name); 
            this.activeModel = next.model;
            this.ctx = this.zoneCanvas.getContext('2d');
            this.ctx.lineWidth = Math.round(this.ins.zoneBrushSize.value);

            this.targets.outs.targetIndex.on("value", this.onTargetChange, this);
            this.targets.outs.snapshotIndex.on("value", this.onSnapshotChange, this);

            next.model.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
            next.model.on<IPointerEvent>("pointer-down", this.onPointerDown, this);
            next.model.on<IPointerEvent>("pointer-move", this.onPointerMove, this);

            next.model.outs.quality.on("value", this.onQualityChange, this);

            if(this.targets.material.map) {
                const baseCtx = this.baseCanvas.getContext('2d');
                baseCtx.save();
                baseCtx.scale(1, -1);
                baseCtx.drawImage(this.targets.material.map.image,0,-this.targets.material.map.image.height);
                baseCtx.restore();
            }

            this.onTargetChange();
        }

        super.onActiveNode(previous, next);
    }

    protected onTargetChange()
    {
        const ins = this.ins;
        const target = this.targets.activeTarget;
   
        if(target && target.type === "Zone")
        {
            var newColor: number[] = [parseInt(target.color.substring(1, 3), 16)/255, parseInt(target.color.substring(3, 5), 16)/255, parseInt(target.color.substring(5, 7), 16)/255];
            ins.zoneTitle.setValue(target.title);
            ins.zoneColor.setValue(newColor);
        }
    }

    protected onSnapshotChange()
    {
        const ins = this.ins;
        const snapshot = this.targets.activeSnapshot;
        const state = snapshot ? this.machine.getState(snapshot.id) : null;

        ins.snapshotTitle.setValue(snapshot ? snapshot.title : "", true);
        ins.snapshotCurve.setValue(state ? state.curve : EEasingCurve.Linear, true);
        ins.snapshotDuration.setValue(state ? state.duration : 1, true);
        ins.snapshotThreshold.setValue(state ? state.threshold : 0.5, true);
    }

    protected onQualityChange()
    {
        const currentCanvas = this.targets.zoneCanvas;
        const currentCtx = currentCanvas.getContext('2d');
        const lineWidth = currentCtx.lineWidth;

        // get new image size
        const derivative = this.targets.model.derivatives.select(EDerivativeUsage.Web3D, this.activeModel.outs.quality.value);
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
        this.targets.zoneTexture = null;
        const refresh = this.targets.zoneTexture;
    }

    updateZoneTexture() {
        this.zoneTexture.needsUpdate = true; 
        this.system.getComponent(CRenderer).forceRender();
    }

    protected onPointerDown(event: IPointerEvent)
    {
        // do not handle event if user is dragging or task is not active
        if (event.isDragging || !this.outs.isActive.value) {
            return;
        }

        // do not handle if zone not selected
        if(!this.targets.activeTarget || this.targets.activeTarget.type != "Zone") {
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

            this.targets.ins.visible.setValue(true);

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
        this.targets.zoneTexture.transformUv( this.uv );

        const brushWidth = this.ins.zoneBrushSize.value;
        this.ctx.fillRect(Math.floor(this.uv.x*this.zoneCanvas.width)-(brushWidth/2), Math.floor(this.uv.y*this.zoneCanvas.height)-(brushWidth/2), brushWidth, brushWidth);
        this.updateZoneTexture();
    }


    protected createBaseCanvas()
    {
        const material = this.targets.material;
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

    protected onSave() {
        const targets = this.targets;
        const currentCanvas = this.targets.zoneCanvas;
    
        //early out if not active targets
        if(!targets.ins.active.value) {   
            //console.log("NO TARGETS");
            return;
        }

        const tempCanvas = document.createElement('canvas') as HTMLCanvasElement;

        if(targets.zoneTexture) {  // TODO: always true, need to change
            const assetBaseName = targets.model.node.name;

            this.qualities.forEach(quality => {
                const derivative = targets.model.derivatives.select(EDerivativeUsage.Web3D, quality);

                if(derivative.data.quality == quality) {
                    const asset = derivative.findAsset(EAssetType.Model);
                    const imageSize : number = +asset.data.imageSize;
                    const qualityName = EDerivativeQuality[quality].toLowerCase();
                    const imageName = assetBaseName + "-zonemap-" + qualityName + ".jpg";

                    // generate image data at correct resolution for this derivative
                    tempCanvas.width = imageSize;
                    tempCanvas.height = imageSize;

                    tempCanvas.getContext('2d').drawImage(currentCanvas,0,0,currentCanvas.width,currentCanvas.height,0,0,imageSize,imageSize);
    
                    const dataURI = tempCanvas.toDataURL();
                    this.saveTexture(imageName, dataURI, quality);

                    // if needed, add new zonemap asset to derivative
                    const imageAssets = derivative.findAssets(EAssetType.Image);
                    if(imageAssets.length === 0 || !imageAssets.some(image => image.data.mapType === EMapType.Zone)) {
                        const newAsset = derivative.createAsset(EAssetType.Image, imageName);
                        newAsset.data.mapType = EMapType.Zone;
                    }
                }
            });
        }
    }

    protected saveTexture(baseName: string, uri: string, quality: EDerivativeQuality) {

        const fileURL = this.assetManager.getAssetUrl(baseName);
        const fileName = this.assetManager.getAssetName(baseName);
        const blob = convert.dataURItoBlob(uri);
        const file = new File([blob], fileName);

        fetch.file(fileURL, "PUT", file)
        .then(() => {
            //this.updateImageMeta(quality, this._mimeType, filePath);
            new Notification(`Successfully uploaded image to '${fileURL}'`, "info", 4000);
        })
        .catch(e => {
            new Notification(`Failed to upload image to '${fileURL}'`, "error", 8000);
        });
    }
}