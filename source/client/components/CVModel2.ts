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

import { Vector3, Quaternion, Box3, Mesh, Group, Matrix4, Box3Helper, Object3D, FrontSide, BackSide, DoubleSide, Texture, CanvasTexture } from "three";

import Notification from "@ff/ui/Notification";

import { ITypedEvent, Node, types } from "@ff/graph/Component";
import CObject3D from "@ff/scene/components/CObject3D";

import * as helpers from "@ff/three/helpers";

import { IDocument, INode } from "client/schema/document";
import { EDerivativeQuality, EDerivativeUsage, EUnitType, IModel, ESideType, TSideType, EAssetType, EMapType, IPBRMaterialSettings } from "client/schema/model";

import unitScaleFactor from "../utils/unitScaleFactor";
import UberPBRMaterial, { EShaderMode } from "../shaders/UberPBRMaterial";
import UberPBRAdvMaterial from "../shaders/UberPBRAdvMaterial";
import Derivative from "../models/Derivative";
import DerivativeList from "../models/DerivativeList";

import CVAnnotationView from "./CVAnnotationView";
import CVAssetManager from "./CVAssetManager";
import CVAssetReader from "./CVAssetReader";
import { Vector3 as LocalVector3 } from "client/schema/common";
import CRenderer from "@ff/scene/components/CRenderer";
import CVEnvironment from "./CVEnvironment";
import CVSetup from "./CVSetup";
import { Dictionary } from "client/../../libs/ff-core/source/types";
import Asset from "client/models/Asset";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _quat = new Quaternion();
const _quat1 = new Quaternion();
const _box = new Box3();
const _mat4 = new Matrix4();

export interface ITagUpdateEvent extends ITypedEvent<"tag-update">
{
}
export interface IModelLoadEvent extends ITypedEvent<"model-load">
{
    quality: EDerivativeQuality;
}

/**
 * Describes an overlay image
 */
export interface IOverlay
{
    texture: Texture;
    asset: Asset;
    fromFile: boolean;
    isDirty: boolean;
}

/**
 * Graph component rendering a model or model part.
 *
 * ### Events
 * - *"bounding-box"* - emitted after the model's bounding box changed
 */
export default class CVModel2 extends CObject3D
{
    static readonly typeName: string = "CVModel2";

    static readonly text: string = "Model";
    static readonly icon: string = "cube";

    static readonly rotationOrder = "ZYX";

    protected static readonly ins = {
        name: types.String("Model.Name"),
        globalUnits: types.Enum("Model.GlobalUnits", EUnitType, EUnitType.cm),
        localUnits: types.Enum("Model.LocalUnits", EUnitType, EUnitType.cm),
        quality: types.Enum("Model.Quality", EDerivativeQuality, EDerivativeQuality.High),
        tags: types.String("Model.Tags"),
        renderOrder: types.Number("Model.RenderOrder", 0),
        shadowSide: types.Enum("Model.ShadowSide", ESideType, ESideType.Back),
        activeTags: types.String("Model.ActiveTags"),
        autoLoad: types.Boolean("Model.AutoLoad", true),
        position: types.Vector3("Model.Position"),
        rotation: types.Vector3("Model.Rotation"),
        center: types.Event("Model.Center"),
        shader: types.Enum("Material.Shader", EShaderMode, EShaderMode.Default),
        overlayMap: types.Option("Material.OverlayMap", ["None"], 0),
        slicerEnabled: types.Boolean("Material.SlicerEnabled", true),
        override: types.Boolean("Material.Override", false),
        color: types.ColorRGB("Material.BaseColor"),
        opacity: types.Percent("Material.Opacity", 1.0),
        hiddenOpacity: types.Percent("Material.HiddenOpacity", 0.0),
        roughness: types.Percent("Material.Roughness", 0.8),
        metalness: types.Percent("Material.Metalness", 0.1),
        occlusion: types.Percent("Material.Occlusion", 0.25),
        doubleSided: types.Boolean("Material.DoubleSided", false),
        dumpDerivatives: types.Event("Derivatives.Dump"),
    };

    protected static readonly outs = {
        unitScale: types.Number("UnitScale", { preset: 1, precision: 5 }),
        quality: types.Enum("LoadedQuality", EDerivativeQuality),
        updated: types.Event("Updated"),
        overlayMap: types.Option("Material.OverlayMap", ["None"], 0)
    };

    ins = this.addInputs<CObject3D, typeof CVModel2.ins>(CVModel2.ins);
    outs = this.addOutputs<CObject3D, typeof CVModel2.outs>(CVModel2.outs);

    get settingProperties() {
        return [
            this.ins.name,
            this.ins.visible,
            this.ins.quality,
            this.ins.localUnits,
            this.ins.tags,
            this.ins.renderOrder,
            this.ins.shadowSide,
            this.ins.shader,
            this.ins.overlayMap,
            this.ins.slicerEnabled,
            this.ins.override,
            this.ins.color,
            this.ins.opacity,
            this.ins.hiddenOpacity,
            this.ins.roughness,
            this.ins.metalness,
            this.ins.occlusion,
            this.ins.doubleSided
        ];
    }

    private _derivatives = new DerivativeList();
    private _activeDerivative: Derivative = null;

    /**
     * Separate from activeDerivative because when switching quality levels,
     * we want to keep the active model until the new one is ready
     */
    private _loadingDerivative :Derivative = null;

    private _visible: boolean = true;
    private _boxFrame: Box3Helper = null;
    private _localBoundingBox = new Box3();
    private _prevPosition: Vector3 = new Vector3(0.0,0.0,0.0);
    private _prevRotation: Vector3 = new Vector3(0.0,0.0,0.0);
    private _materialCache: Dictionary<IPBRMaterialSettings> = {};
    private _overlays: Dictionary<IOverlay> = {};

    constructor(node: Node, id: string)
    {
        super(node, id);

        this.object3D = new Group();
    }

    get snapshotProperties() {
        return [
            this.ins.visible,
            this.ins.quality,
            this.ins.overlayMap,
            this.ins.override,
            this.ins.opacity,
            this.ins.roughness,
            this.ins.metalness,
            this.ins.color,
            this.ins.slicerEnabled
        ];
    }

    get derivatives() {
        return this._derivatives;
    }
    get activeDerivative() {
        return this._activeDerivative;
    }
    get localBoundingBox(): Readonly<Box3> {
        return this._localBoundingBox;
    }

    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }
    protected get assetReader() {
        return this.getMainComponent(CVAssetReader);
    }
    protected get renderer() {
        return this.getMainComponent(CRenderer);
    }

    getOverlay(key: string) : IOverlay {
        if(key in this._overlays) {
            return this._overlays[key];
        }
        else {
            const overlayProp = this.ins.overlayMap;
            if(!overlayProp.schema.options.includes(key)) {
                overlayProp.setOptions(overlayProp.schema.options.concat(key));
            }

            return this._overlays[key] = 
            {
                texture: null,
                asset: null,
                fromFile: false,
                isDirty: false
            };
        }
    }
    getOverlays() { //TODO: This should be more efficient
        return Object.keys(this._overlays).filter(key => this.activeDerivative.findAssets(EAssetType.Image).some(image => image.data.uri == key))
            .map(key => this._overlays[key]);
    }
    deleteOverlay(key: string) {
        const overlayProp = this.ins.overlayMap;
        const options = overlayProp.schema.options;
        options.splice(options.indexOf(key),1);
        overlayProp.setOptions(options);

        this._overlays[key].texture.dispose();
        delete this._overlays[key];
    }

    create()
    {
        super.create();

        // link units with annotation view
        const av = this.node.createComponent(CVAnnotationView);
        av.ins.unitScale.linkFrom(this.outs.unitScale);

        // set quality based on max texture size
        const maxTextureSize = this.renderer.outs.maxTextureSize.value;

        if (maxTextureSize < 2048) {
            this.ins.quality.setValue(EDerivativeQuality.Low);
        }
        else if (maxTextureSize < 4096) {
            this.ins.quality.setValue(EDerivativeQuality.Medium);
        }
        else {
            this.ins.quality.setValue(EDerivativeQuality.High);
        }
    }

    update()
    {
        const ins = this.ins;

        if (ins.name.changed) {
            this.node.name = ins.name.value;
        }

        if (ins.tags.changed || ins.activeTags.changed || ins.visible.changed) {
            let visible = ins.visible.value;

            if (visible) {
                // determine visibility based on whether a tag of this model is selected
                const tags = ins.tags.value.split(",").map(tag => tag.trim()).filter(tag => tag);
                const activeTags = ins.activeTags.value.split(",").map(tag => tag.trim()).filter(tag => tag);

                visible = !tags.length;
                activeTags.forEach(activeTag => {
                    if (tags.indexOf(activeTag) >= 0) {
                        visible = true;
                    }
                });
            }

            const overrideActive = this.ins.override.value;
            this._visible = visible;

            if (visible) {
                this.object3D.visible = true;
                if (overrideActive) {
                    this.updateMaterial();
                }
            }
            else if (ins.visible.value && overrideActive && this.ins.hiddenOpacity.value > 0) {
                this.object3D.visible = true;
                this.updateMaterial();
            }
            else {
                this.object3D.visible = false;
            }

            this.outs.updated.set();
        }

        if (ins.tags.changed) {
            this.emit<ITagUpdateEvent>({ type: "tag-update" });
        }

        if (!this.activeDerivative && ins.autoLoad.changed && ins.autoLoad.value) {
            this.autoLoad(ins.quality.value);
        }
        else if (ins.quality.changed) {
            const derivative = this.derivatives.select(EDerivativeUsage.Web3D, ins.quality.value);
            if (derivative) {
                this.loadDerivative(derivative)
                .catch(error => {
                    console.warn("Model.update - failed to load derivative");
                    console.warn(error);
                });
            }
        }

        if(ins.renderOrder.changed) {
            this.updateRenderOrder(this.object3D, ins.renderOrder.value);
        }

        if (ins.localUnits.changed || ins.globalUnits.changed) {
            this.updateUnitScale();
        }

        if (ins.shader.changed) {
            this.updateShader();
        }

        if (ins.overlayMap.changed) {
            this.updateOverlayMap();
        }

        if (ins.shadowSide.changed) {
            this.updateShadowSide();
        }

        if (ins.override.value && ins.shader.value === EShaderMode.Default && (ins.override.changed ||
            ins.color.changed || ins.opacity.changed || ins.doubleSided.changed ||
                ins.roughness.changed || ins.metalness.changed || ins.occlusion.changed)) {
            this.updateMaterial();
        }
        else if(ins.override.changed && !ins.override.value && ins.shader.value === EShaderMode.Default) {
            this.object3D.traverse(object => {
                const material = object["material"] as UberPBRMaterial | UberPBRAdvMaterial;
                if (material && material.isUberPBRMaterial) {
                    const cachedMat = this._materialCache[material.uuid];
                    material.aoMapMix.setScalar(cachedMat.occlusion);
                    material.color.fromArray(cachedMat.color);
                    material.opacity = cachedMat.opacity;
                    material.transparent = cachedMat.transparent;
                    material.roughness = cachedMat.roughness;
                    material.metalness = cachedMat.metalness;
                    material.side = cachedMat.doubleSided ? DoubleSide : FrontSide;
                    material.needsUpdate = true;
                }
            });
        }

        if (ins.center.changed) {
            this.center();
        }
        if (ins.position.changed || ins.rotation.changed) {
            this.updateMatrixFromProps();
        }
        if (ins.dumpDerivatives.changed) {
            console.log(this.derivatives.toString(true));
        }

        return true;
    }

    dispose()
    {
        this.derivatives.clear();
        this._activeDerivative = null;
        for (let key in this._overlays) {
            if(this._overlays[key].texture) {
                this._overlays[key].texture.dispose();
            }
        }

        super.dispose();
    }

    center()
    {
        const object3D = this.object3D;
        const position = this.ins.position;

        // remove position and scaling, but preserve rotation
        object3D.matrix.decompose(_vec3a, _quat, _vec3b);
        object3D.matrix.makeRotationFromQuaternion(_quat);

        // compute local bounding box and set position offset
        _box.makeEmpty();
        helpers.computeLocalBoundingBox(object3D, _box, object3D.parent);
        _box.getCenter(_vec3a);
        _vec3a.multiplyScalar(-1).toArray(position.value);

        // trigger matrix update
        position.set();
    }

    setFromMatrix(matrix: Matrix4)
    {
        const ins = this.ins;

        matrix.decompose(_vec3a, _quat, _vec3b);

        _vec3a.multiplyScalar(1 / this.outs.unitScale.value).toArray(ins.position.value);
        ins.position.set();

        helpers.quaternionToDegrees(_quat, CVModel2.rotationOrder, ins.rotation.value);
        ins.rotation.set();
    }

    fromDocument(document: IDocument, node: INode): number
    {
        const { ins, outs } = this;
        
        if (!isFinite(node.model)) {
            throw new Error("model property missing in node");
        }

        const data = document.models[node.model];

        ins.name.setValue(node.name);

        const units = EUnitType[data.units || "cm"];
        ins.localUnits.setValue(isFinite(units) ? units : EUnitType.cm);

        ins.visible.setValue(data.visible !== undefined ? data.visible : true);
        ins.tags.setValue(data.tags || "");
        ins.renderOrder.setValue(data.renderOrder !== undefined ? data.renderOrder : 0);

        const side = ESideType[data.shadowSide || "Back"];
        ins.shadowSide.setValue(isFinite(side) ? side : ESideType.Back);

        ins.position.reset();
        ins.rotation.reset();

        if (data.translation) {
            ins.position.copyValue(data.translation);
            this._prevPosition.fromArray(data.translation);
        }

        if (data.rotation) {
            _quat.fromArray(data.rotation);
            helpers.quaternionToDegrees(_quat, CVModel2.rotationOrder, ins.rotation.value);
            this._prevRotation.fromArray(ins.rotation.value);
            ins.rotation.set();
        }

        if (data.boundingBox) {
            const boundingBox = this._localBoundingBox;
            boundingBox.min.fromArray(data.boundingBox.min);
            boundingBox.max.fromArray(data.boundingBox.max);

            this._boxFrame = new Box3Helper(boundingBox, "#009cde");
            this.addObject3D(this._boxFrame);
            this._boxFrame.updateMatrixWorld(true);
        
            const setup = this.getGraphComponent(CVSetup, true);
            if(setup && setup.navigation.ins.autoZoom.value) {
                setup.navigation.ins.zoomExtents.set();
            }
            outs.updated.set();
            this.updateUnitScale();
        }

        if (data.derivatives) {
            this.derivatives.fromJSON(data.derivatives);
        }
        if (data.material) {
            const material = data.material; 
            ins.copyValues({
                override: true,
                color: material.color || ins.color.schema.preset,
                opacity: material.opacity !== undefined ? material.opacity : ins.opacity.schema.preset,
                hiddenOpacity: material.hiddenOpacity !== undefined ? material.hiddenOpacity : ins.hiddenOpacity.schema.preset,
                roughness: material.roughness !== undefined ? material.roughness : ins.roughness.schema.preset,
                metalness: material.metalness !== undefined ? material.metalness : ins.metalness.schema.preset,
                occlusion: material.occlusion !== undefined ? material.occlusion : ins.occlusion.schema.preset,
                doubleSided: material.doubleSided !== undefined ? material.doubleSided : ins.doubleSided.schema.preset
            });
        }

        if (data.overlayMap) {
            ins.overlayMap.setValue(data.overlayMap);
        }

        if (data.annotations) {
            this.getComponent(CVAnnotationView).fromData(data.annotations);
        }

        // emit tag update event
        this.emit<ITagUpdateEvent>({ type: "tag-update" });

        // trigger automatic loading of derivatives if active
        this.ins.autoLoad.set();

        return node.model;
    }

    toDocument(document: IDocument, node: INode): number
    {
        const data = {
            units: EUnitType[this.ins.localUnits.getValidatedValue()]
        } as IModel;

        const ins = this.ins;

        if (!ins.visible.value) {
            data.visible = false;
        }
        if (ins.tags.value) {
            data.tags = ins.tags.value;
        }
        if (ins.renderOrder.value !== 0) {
            data.renderOrder = ins.renderOrder.value;
        }
        if(ins.shadowSide.value != ESideType.Back) {
            data.shadowSide = ESideType[this.ins.shadowSide.getValidatedValue()] as TSideType;
        }

        const position = ins.position.value;
        if (position[0] !== 0 || position[1] !== 0 || position[2] !== 0) {
            data.translation = ins.position.value;
        }

        const rotation = ins.rotation.value;
        if (rotation[0] !== 0 || rotation[1] !== 0 || rotation[2] !== 0) {
            helpers.degreesToQuaternion(rotation, CVModel2.rotationOrder, _quat);
            data.rotation = _quat.toArray();
        }

        if (ins.override.value) {
            data.material = {
                color: ins.color.value,
                opacity: ins.opacity.value,
                hiddenOpacity: ins.hiddenOpacity.value,
                roughness: ins.roughness.value,
                metalness: ins.metalness.value,
                occlusion: ins.occlusion.value,
                doubleSided: ins.doubleSided.value
            };
        }

        if (ins.overlayMap.value !== 0) {
            data.overlayMap = ins.overlayMap.value;
        }

        data.boundingBox = {
            min: this._localBoundingBox.min.toArray() as LocalVector3,
            max: this._localBoundingBox.max.toArray() as LocalVector3
        };

        data.derivatives = this.derivatives.toJSON();

        const annotations = this.getComponent(CVAnnotationView).toData();
        if (annotations && annotations.length > 0) {
            data.annotations = annotations;
        }

        document.models = document.models || [];
        const modelIndex = document.models.length;
        document.models.push(data);
        return modelIndex;
    }

    protected updateShader()
    {
        const shader = this.ins.shader.getValidatedValue();
        this.object3D.traverse(object => {
            const material = object["material"] as UberPBRMaterial | UberPBRAdvMaterial;
            if (material && material.isUberPBRMaterial) {
                material.setShaderMode(shader);
            }
        });
    }

    protected updateShadowSide() {
        this.object3D.traverse(object => {
            const material = object["material"] as UberPBRMaterial | UberPBRAdvMaterial;
            if (material && material.isUberPBRMaterial) {
                if(this.ins.shadowSide.value == ESideType.Front) {
                    material.shadowSide = FrontSide;
                }
                else {
                    material.shadowSide = BackSide;
                }
                material.needsUpdate = true;
            }
        });
    }

    updateOverlayMap() {
        // only update if we are not currently tweening
        const setup = this.getGraphComponent(CVSetup, true);
        if (setup && setup.snapshots.outs.tweening.value) {
            setup.snapshots.outs.end.once("value", () => {
                this.ins.overlayMap.set();
                this.update();
            });
            return;
        }

        const overlays = this.getOverlays();
        const currIdx = this.ins.overlayMap.value-1;
        if (currIdx >= 0 && overlays.length > currIdx) {
            const mapURI = this.getOverlays()[currIdx].asset.data.uri;
            const texture = this.getOverlay(mapURI).texture;
            if(texture) {
                this.updateOverlayMaterial(texture, mapURI);
            }
            else {
                this.assetReader.getTexture(mapURI).then(map => {
                    this.getOverlay(mapURI).texture = map;
                    this.updateOverlayMaterial(map, mapURI);
                });
            }
        }
        else {
            this.updateOverlayMaterial(null, null);
        }
    }

    // helper function to update overlay map state
    protected updateOverlayMaterial(texture: Texture, uri: string)
    {
        if(this.object3D) {
            this.object3D.traverse(object => {
                const material = object["material"];
                if (material && material.isUberPBRMaterial) {
                    if(texture) {
                        texture.flipY = false;
                        material.enableOverlayAlpha(uri.endsWith(".jpg"));
                    }
                    material.zoneMap = texture;
                    material.enableZoneMap(texture != null);
                }
            });
            this.outs.overlayMap.setValue(this.ins.overlayMap.value);
        }
    }

    protected updateMaterial()
    {
        const ins = this.ins;

        this.object3D.traverse(object => {
            const material = object["material"] as UberPBRMaterial | UberPBRAdvMaterial;
            if (material && material.isUberPBRMaterial) {
                material.aoMapMix.setScalar(ins.occlusion.value);
                material.color.fromArray(ins.color.value);
                material.opacity = this._visible ? ins.opacity.value : ins.hiddenOpacity.value;
                material.transparent = material.opacity < 1 || this._materialCache[material.uuid].transparent;
                //material.depthWrite = material.opacity === 1;
                material.roughness = ins.roughness.value;
                material.metalness = ins.metalness.value;
                material.side = ins.doubleSided.value ? DoubleSide : FrontSide;
                material.needsUpdate = true;
            }
        });
    }

    protected updateUnitScale()
    {
        const fromUnits = this.ins.localUnits.getValidatedValue();
        const toUnits = this.ins.globalUnits.getValidatedValue();
        this.outs.unitScale.setValue(unitScaleFactor(fromUnits, toUnits));

        if (ENV_DEVELOPMENT) {
            console.log("Model.updateUnitScale, from: %s, to: %s", fromUnits, toUnits);
        }

        this.updateMatrixFromProps();
    }

    protected updateMatrixFromProps()
    {
        const ins = this.ins;
        const unitScale = this.outs.unitScale.value;
        const object3D = this.object3D;

        _vec3a.fromArray(ins.position.value).multiplyScalar(unitScale);
        helpers.degreesToQuaternion(ins.rotation.value, CVModel2.rotationOrder, _quat);
        _vec3b.setScalar(unitScale);
        object3D.matrix.compose(_vec3a, _quat, _vec3b);
        object3D.matrixWorldNeedsUpdate = true;

        //TODO: Cleanup & optimize annotation update
        helpers.degreesToQuaternion([this._prevRotation.x, this._prevRotation.y, this._prevRotation.z], CVModel2.rotationOrder, _quat1);
        _quat1.invert();
        _vec3b.setScalar(1);
        _mat4.compose(_vec3a.fromArray(ins.position.value), _quat, _vec3b);

        const annotations = this.getComponent(CVAnnotationView);
        annotations.getAnnotations().forEach(anno => {
            _vec3a.fromArray(anno.data.position);
            _vec3a.sub(this._prevPosition);
            _vec3a.applyQuaternion(_quat1);
            _vec3a.applyMatrix4(_mat4);
            
            anno.data.position = _vec3a.toArray();

            _vec3a.fromArray(anno.data.direction);
            _vec3a.applyQuaternion(_quat1);
            _vec3a.applyQuaternion(_quat);
            
            anno.data.direction = _vec3a.toArray();

            anno.update();
            annotations.updateAnnotation(anno, true);
        });
        this._prevPosition.copy(_vec3a.fromArray(ins.position.value));
        this._prevRotation.copy(_vec3a.fromArray(ins.rotation.value));

        this.outs.updated.set();
    }

    protected updateRenderOrder(model: Object3D, value: number)
    {
        model.renderOrder = value;
        model.children.forEach(child => this.updateRenderOrder(child, value));
    }

    /**
     * Automatically loads derivatives up to the given quality.
     * First loads the lowest available quality (usually thumb), then
     * loads the desired quality level.
     * @param quality
     */
    protected autoLoad(quality: EDerivativeQuality): Promise<void>
    {
        const sequence : Derivative[] = [];

        const lowestQualityDerivative = this.derivatives.select(EDerivativeUsage.Web3D, EDerivativeQuality.Thumb);
        if (lowestQualityDerivative) {
            sequence.push(lowestQualityDerivative);
        }

        const targetQualityDerivative = this.derivatives.select(EDerivativeUsage.Web3D, quality);
        if (targetQualityDerivative && targetQualityDerivative !== lowestQualityDerivative) {
            sequence.push(targetQualityDerivative);
        }

        if (sequence.length === 0) {
            Notification.show(`No 3D derivatives available for '${this.displayName}'.`);
            return Promise.resolve();
        }

        // load sequence of derivatives one by one
        return sequence.reduce((promise, derivative) => {
            return promise.then(() => this.loadDerivative(derivative)); 
        }, Promise.resolve());
    }

    /**
     * Loads and displays the given derivative.
     * @param derivative
     */
    protected async loadDerivative(derivative: Derivative): Promise<void>
    {
        if(!this.node || !this.assetReader) {    // TODO: Better way to handle active loads when node has been disposed?
            console.warn("Model load interrupted.");
            return;
        }
        if(this._loadingDerivative && this._loadingDerivative != derivative) {
            this._loadingDerivative.unload();
            this._loadingDerivative = null;
        }
        if (this._activeDerivative == derivative){
            return;
        }
        if(this._loadingDerivative == derivative) {
            return new Promise(resolve=> this._loadingDerivative.on("load", resolve));
        }
        
        this._loadingDerivative = derivative;

        return derivative.load(this.assetReader)
            .then(() => {
                if ( !derivative.model
                  || !this.node
                  || (this._activeDerivative && derivative.data.quality != this.ins.quality.value)
                ) {
                    //Either derivative is not valid, or we have been disconnected, 
                    // or this derivative is no longer needed as it's not the requested quality 
                    // AND we already have _something_ to display
                    derivative.unload();
                    return;
                }

                if(this._activeDerivative && this._activeDerivative == derivative){
                    //a race condition can happen where a derivative fires it's callback but it's already the active one.
                    return;
                }

                // set asset manager flag for initial model load
                if(!this.assetManager.initialLoad && !this._activeDerivative) {
                    this.assetManager.initialLoad = true; 
                }

                if (this._activeDerivative) {
                    if(this._activeDerivative.model) this.removeObject3D(this._activeDerivative.model);
                    this._activeDerivative.unload();
                }
                this._activeDerivative = derivative;
                this._loadingDerivative = null;
                this.addObject3D(derivative.model);
                this.renderer.activeSceneComponent.scene.updateMatrixWorld(true);

                if (this._boxFrame) {
                    this.removeObject3D(this._boxFrame);
                    this._boxFrame.dispose();
                    this._boxFrame = null;
                }

                // update bounding box based on loaded derivative
                this._localBoundingBox.makeEmpty();
                helpers.computeLocalBoundingBox(derivative.model, this._localBoundingBox);
                this.outs.updated.set();

                if (ENV_DEVELOPMENT) {
                    // log bounding box to console
                    const box = { min: this._localBoundingBox.min.toArray(), max: this._localBoundingBox.max.toArray() };
                    console.log("CVModel.onLoad - bounding box: ", box);
                }

                // update loaded quality property
                this.outs.quality.setValue(derivative.data.quality);

                // cache original material properties
                this.object3D.traverse(object => {
                    const material = object["material"] as UberPBRMaterial | UberPBRAdvMaterial;
                    if (material && material.isUberPBRMaterial) {
                        this._materialCache[material.uuid] = {
                            color: material.color.toArray(),
                            opacity: material.opacity,
                            hiddenOpacity: this.ins.hiddenOpacity.schema.preset,
                            roughness: material.roughness,
                            metalness: material.metalness,
                            occlusion: material.aoMapMix.x,
                            doubleSided: material.side == DoubleSide,
                            transparent: material.transparent
                        }
                    }
                });

                if (this.ins.override.value) {
                    this.updateMaterial();
                }

                // update shadow render side
                if(this.ins.shadowSide.value != ESideType.Back) {
                    this.updateShadowSide();
                }

                // flag environment map to update if needed
                this.getGraphComponent(CVEnvironment).ins.dirty.set(); 

                // make sure render order is correct
                if(this.ins.renderOrder.value !== 0)
                    this.updateRenderOrder(this.object3D, this.ins.renderOrder.value);

                // load overlays
                const overlayProp = this.ins.overlayMap;
                overlayProp.setOptions(["None"]);
                derivative.findAssets(EAssetType.Image).filter(image => image.data.mapType === EMapType.Zone).forEach(image => {
                    overlayProp.setOptions(overlayProp.schema.options.concat(image.data.uri));
                    const overlay = this.getOverlay(image.data.uri);
                    overlay.asset = image;
                    overlay.fromFile = true;
                });

                if(this.ins.overlayMap.value !== 0) {
                    this.ins.overlayMap.set();
                }

                this.emit<IModelLoadEvent>({ type: "model-load", quality: derivative.data.quality });
                //this.getGraphComponent(CVSetup).navigation.ins.zoomExtents.set(); 
            }).catch(error =>{
                if(error.name == "AbortError" || error.name == "ABORT_ERR") return;
                console.error(error);
                Notification.show(`Failed to load model derivative: ${error.message}`)
            });
    }

    protected addObject3D(object: Object3D)
    {
        this.object3D.add(object);
        this.object3D.traverse(node => {
            if (node.type === "Mesh") {
                this.registerPickableObject3D(node, true);
            }
        });
    }
}