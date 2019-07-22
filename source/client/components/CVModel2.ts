/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import Notification from "@ff/ui/Notification";

import { ITypedEvent, Node, types } from "@ff/graph/Component";
import CObject3D from "@ff/scene/components/CObject3D";

import * as helpers from "@ff/three/helpers";

import { IDocument, INode } from "client/schema/document";
import { EDerivativeQuality, EDerivativeUsage, EUnitType, IModel } from "client/schema/model";

import unitScaleFactor from "../utils/unitScaleFactor";
import UberPBRMaterial, { EShaderMode } from "../shaders/UberPBRMaterial";
import Derivative from "../models/Derivative";
import DerivativeList from "../models/DerivativeList";

import CVAnnotationView from "./CVAnnotationView";
import CVAssetReader from "./CVAssetReader";
import { Vector3 } from "client/schema/common";
import CRenderer from "@ff/scene/components/CRenderer";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _box = new THREE.Box3();

export interface ITagUpdateEvent extends ITypedEvent<"tag-update">
{
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
        globalUnits: types.Enum("Model.GlobalUnits", EUnitType, EUnitType.cm),
        localUnits: types.Enum("Model.LocalUnits", EUnitType, EUnitType.cm),
        quality: types.Enum("Model.Quality", EDerivativeQuality, EDerivativeQuality.High),
        tags: types.String("Model.Tags"),
        activeTags: types.String("Model.ActiveTags"),
        autoLoad: types.Boolean("Model.AutoLoad", true),
        position: types.Vector3("Model.Position"),
        rotation: types.Vector3("Model.Rotation"),
        center: types.Event("Model.Center"),
        shader: types.Enum("Material.Shader", EShaderMode, EShaderMode.Default),
        override: types.Boolean("Material.Override"),
        color: types.ColorRGB("Material.BaseColor"),
        opacity: types.Percent("Material.Opacity", 1.0),
        hiddenOpacity: types.Percent("Material.HiddenOpacity", 0.0),
        roughness: types.Percent("Material.Roughness", 0.8),
        metalness: types.Percent("Material.Metalness", 0.1),
        occlusion: types.Percent("Material.Occlusion", 0.3),
        dumpDerivatives: types.Event("Derivatives.Dump"),
    };

    protected static readonly outs = {
        unitScale: types.Number("UnitScale", { preset: 1, precision: 5 }),
        quality: types.Enum("LoadedQuality", EDerivativeQuality),
    };

    ins = this.addInputs<CObject3D, typeof CVModel2.ins>(CVModel2.ins);
    outs = this.addOutputs<CObject3D, typeof CVModel2.outs>(CVModel2.outs);

    get settingProperties() {
        return [
            this.ins.visible,
            this.ins.quality,
            this.ins.localUnits,
            this.ins.tags,
            this.ins.shader,
            this.ins.override,
            this.ins.color,
            this.ins.opacity,
            this.ins.hiddenOpacity,
            this.ins.roughness,
            this.ins.metalness,
            this.ins.occlusion,
        ];
    }

    private _derivatives = new DerivativeList();
    private _activeDerivative: Derivative = null;

    private _visible: boolean = true;
    private _boundingBox: THREE.Box3;
    private _boxFrame: THREE.Mesh = null;

    constructor(node: Node, id: string)
    {
        super(node, id);

        this.object3D = new THREE.Group();
        this._boundingBox = new THREE.Box3().makeEmpty();
    }

    get derivatives() {
        return this._derivatives;
    }
    get boundingBox() {
        return this._boundingBox;
    }
    get activeDerivative() {
        return this._activeDerivative;
    }

    protected get assetReader() {
        return this.getMainComponent(CVAssetReader);
    }
    protected get renderer() {
        return this.getMainComponent(CRenderer);
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

        if (ins.tags.changed || ins.activeTags.changed || ins.visible.changed) {
            let visible = ins.visible.value;

            if (visible) {
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
        }

        if (ins.tags.changed) {
            this.emit<ITagUpdateEvent>({ type: "tag-update" });
        }

        if (!this.activeDerivative && ins.autoLoad.changed && ins.autoLoad.value) {
            this.autoLoad(ins.quality.value);
        }
        else if (ins.quality.changed) {
            const derivative = this.derivatives.select(EDerivativeUsage.Web3D, ins.quality.value);
            if (derivative && derivative !== this.activeDerivative) {
                this.loadDerivative(derivative)
                .catch(error => {
                    console.warn("Model.update - failed to load derivative");
                    console.warn(error);
                });
            }
        }

        if (ins.localUnits.changed || ins.globalUnits.changed) {
            this.updateUnitScale();
            this.emit("bounding-box");
        }

        if (ins.shader.changed) {
            this.updateShader();
        }

        if (ins.override.value && ins.shader.value === EShaderMode.Default && (ins.override.changed ||
            ins.color.changed || ins.opacity.changed ||
                ins.roughness.changed || ins.metalness.changed || ins.occlusion.changed)) {
            this.updateMaterial();
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

        super.dispose();
    }

    center()
    {
        const object3D = this.object3D;
        const position = this.ins.position;

        object3D.matrix.decompose(_vec3a, _quat, _vec3b);
        object3D.matrix.makeRotationFromQuaternion(_quat);
        _box.makeEmpty();
        helpers.computeLocalBoundingBox(object3D, _box, object3D.parent);
        _box.getCenter(_vec3a);
        _vec3a.multiplyScalar(-1).toArray(position.value);
        position.set();
    }

    setFromMatrix(matrix: THREE.Matrix4)
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
        const ins = this.ins;

        if (!isFinite(node.model)) {
            throw new Error("model property missing in node");
        }

        const data = document.models[node.model];

        const units = EUnitType[data.units || "cm"];
        ins.localUnits.setValue(isFinite(units) ? units : EUnitType.cm);

        ins.visible.setValue(data.visible !== undefined ? data.visible : true);
        ins.tags.setValue(data.tags || "");

        ins.position.reset();
        ins.rotation.reset();

        if (data.translation) {
            ins.position.copyValue(data.translation);
        }

        if (data.rotation) {
            _quat.fromArray(data.rotation);
            helpers.quaternionToDegrees(_quat, CVModel2.rotationOrder, ins.rotation.value);
            ins.rotation.set();
        }

        if (data.boundingBox) {
            this._boundingBox.min.fromArray(data.boundingBox.min);
            this._boundingBox.max.fromArray(data.boundingBox.max);

            this._boxFrame = new (THREE.Box3Helper as any)(this._boundingBox, "#009cde");
            this.addObject3D(this._boxFrame);

            this.emit("bounding-box");
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
            });
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
            };
        }

        data.boundingBox = {
            min: this._boundingBox.min.toArray() as Vector3,
            max: this._boundingBox.max.toArray() as Vector3
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
            const material = object["material"] as UberPBRMaterial;
            if (material && material.isUberPBRMaterial) {
                material.setShaderMode(shader);
            }
        });
    }

    protected updateMaterial()
    {
        const ins = this.ins;

        this.object3D.traverse(object => {
            const material = object["material"] as UberPBRMaterial;
            if (material && material.isUberPBRMaterial) {
                material.aoMapMix.setScalar(ins.occlusion.value);
                material.color.fromArray(ins.color.value);
                material.opacity = this._visible ? ins.opacity.value : ins.hiddenOpacity.value;
                material.transparent = material.opacity < 1 || !!material.alphaMap;
                material.depthWrite = material.opacity === 1;
                material.roughness = ins.roughness.value;
                material.metalness = ins.metalness.value;
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
    }

    /**
     * Automatically loads derivatives up to the given quality.
     * First loads the lowest available quality (usually thumb), then
     * loads the desired quality level.
     * @param quality
     */
    protected autoLoad(quality: EDerivativeQuality): Promise<void>
    {
        const sequence = [];

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
    protected loadDerivative(derivative: Derivative): Promise<void>
    {
        return derivative.load(this.assetReader)
            .then(() => {
                if (!derivative.model) {
                    return;
                }

                if (this._activeDerivative) {
                    this.removeObject3D(this._activeDerivative.model);
                    this._activeDerivative.unload();
                    //this.getMainComponent(CRenderer).logInfo();
                }

                this._activeDerivative = derivative;
                this.addObject3D(derivative.model);

                if (this._boxFrame) {
                    this.removeObject3D(this._boxFrame);
                    this._boxFrame.geometry.dispose();
                    this._boxFrame = null;
                }

                // update bounding box based on loaded derivative
                helpers.computeLocalBoundingBox(derivative.model, this._boundingBox);
                this.emit("bounding-box");

                // test output bounding box
                const box = { min: this._boundingBox.min.toArray(), max: this._boundingBox.max.toArray() };

                if (ENV_DEVELOPMENT) {
                    console.log("CVModel.onLoad - bounding box: ", box);
                }

                // update loaded quality property
                this.outs.quality.setValue(derivative.data.quality);

                if (this.ins.override) {
                    this.updateMaterial();
                }
            })
            .catch(error => Notification.show(`Failed to load model derivative: ${error.message}`));
    }
}