/**
 * 3D Foundation Project
 * Copyright 2026 Smithsonian Institution
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

import { PlaneGeometry, MeshBasicMaterial, DoubleSide, Mesh, Quaternion, MeshStandardMaterial } from "three";
import CVModel2 from "./CVModel2";
import CVAnnotationView, { ITagUpdateEvent } from "./CVAnnotationView";
import { IDocument } from "./CVDocument";
import { EUnitType, INode } from "client/schema/document";
import * as helpers from "@ff/three/helpers";
import { IModel } from "client/schema/model";
import { addCustomMaterialDefines, extendShaders } from "client/shaders/ShaderExtension";

//////////////////////////////////////////////////////////////////

const _quat = new Quaternion();

export default class CVImagePlane extends CVModel2
{
    static readonly typeName: string = "CVImagePlane";

    static readonly text: string = "ImagePlane";

    private _material: MeshBasicMaterial = null;
    private _geometry: PlaneGeometry = null;

    get settingProperties() {
        return [
            this.ins.name,
            this.ins.tags,
            this.ins.visible,
            this.ins.color,
            this.ins.opacity,
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.visible,
            this.ins.opacity,
        ];
    }

    create()
    {
        super.create();
        
        this._geometry = new PlaneGeometry( 100, 100 );
        this._material = new MeshBasicMaterial( {color: 0xffff00, side: DoubleSide} );
        const plane = new Mesh( this._geometry, this._material );
        plane.matrixAutoUpdate = false;
        this.addObject3D(plane);
    }

    dispose()
    {
        this._material.map.dispose();
        this._material.dispose();
        this._geometry.dispose();
        super.dispose();
    }

    setImage(uri: string)
    {
        // load image
        this.assetReader.getTexture(uri).then(map => {
            this._material.map = map;
            this._material.needsUpdate = true;
        });
    }

    update(): boolean
    {
        const ins = this.ins;

        if (ins.color.changed) {
            this._material.color.fromArray(ins.color.value);
        }

        if (ins.opacity.changed) {
            this._material.opacity = ins.opacity.value;
            this._material.transparent = this._material.opacity < 1;
            this._material.needsUpdate = true;
        }

        super.update();

        return true;
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
        //ins.renderOrder.setValue(data.renderOrder !== undefined ? data.renderOrder : 0);

        //const side = ESideType[data.shadowSide || "Back"];
        //ins.shadowSide.setValue(isFinite(side) ? side : ESideType.Back);

        ins.position.reset();
        ins.rotation.reset();

        if (data.translation) {
            ins.position.copyValue(data.translation);
            //this._prevPosition.fromArray(data.translation);
        }

        if (data.rotation) {
            _quat.fromArray(data.rotation);
            helpers.quaternionToDegrees(_quat, CVModel2.rotationOrder, ins.rotation.value);
            //this._prevRotation.fromArray(ins.rotation.value);
            ins.rotation.set();
        }

        /*if (data.boundingBox) {
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
        }*/

        if (data.derivatives) {
            this.derivatives.fromJSON(data.derivatives);

            this.setImage(data.derivatives[0].assets[0].uri);
        }
        if (data.material) {
            const material = data.material; 
            ins.copyValues({
                //override: true,
                color: material.color || ins.color.schema.preset,
                opacity: material.opacity !== undefined ? material.opacity : ins.opacity.schema.preset,
                //hiddenOpacity: material.hiddenOpacity !== undefined ? material.hiddenOpacity : ins.hiddenOpacity.schema.preset,
                //roughness: material.roughness !== undefined ? material.roughness : ins.roughness.schema.preset,
                //metalness: material.metalness !== undefined ? material.metalness : ins.metalness.schema.preset,
                //occlusion: material.occlusion !== undefined ? material.occlusion : ins.occlusion.schema.preset,
                //doubleSided: material.doubleSided !== undefined ? material.doubleSided : ins.doubleSided.schema.preset
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
        //this.ins.autoLoad.set();

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
        //if(ins.shadowSide.value != ESideType.Back) {
        //    data.shadowSide = ESideType[this.ins.shadowSide.getValidatedValue()] as TSideType;
        //}

        if (!ins.color.value.every(n => n === 1) || ins.opacity.value < 1) {
            data.material = {
                color: ins.color.value,
                opacity: ins.opacity.value,
                //hiddenOpacity: ins.hiddenOpacity.value,
                //roughness: ins.roughness.value,
                //metalness: ins.metalness.value,
                //occlusion: ins.occlusion.value,
                //doubleSided: ins.doubleSided.value
            };
        }

        if (ins.overlayMap.value !== 0) {
            data.overlayMap = ins.overlayMap.value;
        }

        //data.boundingBox = {
        //    min: this._localBoundingBox.min.toArray() as LocalVector3,
        //    max: this._localBoundingBox.max.toArray() as LocalVector3
        //};

        const position = ins.position.value;
        if (position[0] !== 0 || position[1] !== 0 || position[2] !== 0) {
            data.translation = ins.position.value;
        }

        const rotation = ins.rotation.value;
        if (rotation[0] !== 0 || rotation[1] !== 0 || rotation[2] !== 0) {
            helpers.degreesToQuaternion(rotation, CVModel2.rotationOrder, _quat);
            data.rotation = _quat.toArray();
        }

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

    protected autoLoad(): Promise<void>
    {
        return Promise.resolve();
    }
}