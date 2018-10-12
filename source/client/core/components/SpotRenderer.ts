/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
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

import { ComponentTracker } from "@ff/core/ecs/Component";

import SpotAnnotations, { ISpotAnnotation, ISpotAnnotationsChangeEvent } from "./SpotAnnotations";
import Object3D from "./Object3D";
import { Dictionary } from "@ff/core/types";
import { IPickable, IPickResult, IManipPointerEvent, IManipTriggerEvent } from "./PickManip";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new THREE.Vector3();

interface ISpotEntry
{
    annotation: ISpotAnnotation;
    mesh: THREE.Mesh;
}

export default class SpotRenderer extends Object3D implements IPickable
{
    static readonly type: string = "SpotRenderer";

    protected annotations: ComponentTracker<SpotAnnotations> = null;
    protected spots: Dictionary<ISpotEntry> = {}; // by Object3D id

    create(context)
    {
        super.create(context);

        this.object3D = new THREE.Group();
        this.object3D.updateMatrix();

        this.annotations = this.trackComponent(SpotAnnotations, component => {
            component.getArray().forEach(annotation => this.addAnnotation(annotation));
            component.on("change", this.onAnnotationsChange, this);
        }, component => {
            component.off("change", this.onAnnotationsChange, this);
            component.getArray().forEach(annotation => this.removeAnnotation(annotation));
        });
    }

    addAnnotation(annotation: ISpotAnnotation)
    {
        const geo = new THREE.ConeBufferGeometry(0.8, 1.6, 24);
        geo.translate(0, -0.8, 0);
        geo.rotateX(Math.PI);

        const mat = new THREE.MeshPhongMaterial({ color: "red" });

        const mesh = new THREE.Mesh(geo, mat);
        _vec3.fromArray(annotation.direction);
        mesh.quaternion.setFromUnitVectors(THREE.Object3D.DefaultUp, _vec3);
        mesh.position.fromArray(annotation.position);

        this.object3D.add(mesh);

        this.spots[mesh.id] = {
            annotation,
            mesh
        };
    }

    removeAnnotation(annotation: ISpotAnnotation)
    {
        const key = Object.keys(this.spots).find(key => this.spots[key].annotation.id === annotation.id);
        if (key) {
            this.object3D.remove(this.spots[key].mesh);
            delete this.spots[key];
        }
    }

    onPointer(event: IManipPointerEvent, pickInfo: IPickResult)
    {
        if (event.isPrimary && event.type === "up") {
            const spot = this.spots[pickInfo.object.id];
            if (spot) {
                console.log(spot.annotation.title);
            }
        }

        return false;
    }

    onTrigger(event: IManipTriggerEvent, pickInfo: IPickResult)
    {
        return false;
    }

    protected onAnnotationsChange(event: ISpotAnnotationsChangeEvent)
    {
        if (event.what === "add") {
            this.addAnnotation(event.annotation);
        }
        else if (event.what === "remove") {
            this.removeAnnotation(event.annotation);
        }
    }
}