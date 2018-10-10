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

import { IManipEvent, IManipListener } from "@ff/react/Manip.old";
import math from "@ff/core/math";

type Mode = "off" | "pan" | "orbit" | "dolly" | "zoom" | "pan-dolly" | "roll";
type Phase = "off" | "active" | "runout";

const _vec = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _spherical = new THREE.Spherical();

export interface IOrbitPosition
{
    x: number;
    y: number;
    z: number;
    head: number;
    pitch: number;
    dist: number;
}

export default class OrbitController implements IManipListener
{
    readonly target: THREE.Vector3;
    readonly distanceLimits: THREE.Vector2;

    private camera: THREE.PerspectiveCamera;

    private mode: Mode;
    private phase: Phase;
    private viewportWidth: number;
    private viewportHeight: number;

    private deltaX;
    private deltaY;
    private deltaPinch;
    private deltaWheel;

    private rotToYUp: THREE.Quaternion;
    private rotFromYUp: THREE.Quaternion;
    private lastPosition: THREE.Vector3;
    private lastQuaternion: THREE.Quaternion;

    constructor(camera: THREE.PerspectiveCamera)
    {
        this.target = new THREE.Vector3();
        this.distanceLimits = new THREE.Vector2(0.05, 5);

        this.camera = camera;

        this.mode = "off";
        this.phase = "off";
        this.viewportWidth = 1;
        this.viewportHeight = 1;

        this.deltaX = 0;
        this.deltaY = 0;
        this.deltaPinch = 1;
        this.deltaWheel = 0;

        this.rotToYUp = new THREE.Quaternion().setFromUnitVectors(camera.up, new THREE.Vector3(0, 1, 0));
        this.rotFromYUp = this.rotToYUp.clone().inverse();
        this.lastPosition = new THREE.Vector3();
        this.lastQuaternion = new THREE.Quaternion();
    }

    init()
    {
        this.updateCamera(0, 0, 0, 0, 1);
    }

    update(): boolean
    {
        let updated = false;

        if (this.deltaWheel !== 0) {
            this.updateCamera(0, 0, 0, 0, this.deltaWheel * -0.07 + 1);
            this.deltaWheel = 0;
            updated = true;
        }

        if (this.phase === "off") {
            return updated;
        }

        if (this.phase === "active") {
            this.updateManip();

            this.deltaX = 0;
            this.deltaY = 0;
            this.deltaPinch = 1;
        }
        else {
            this.deltaX *= 0.85;
            this.deltaY *= 0.85;
            this.deltaPinch = 1;

            this.updateManip();

            const delta = Math.abs(this.deltaX) + Math.abs(this.deltaY);
            if (delta < 0.1) {
                this.mode = "off";
                this.phase = "off";
            }
        }

        //console.log(this.getCamera());
        return true;
    }

    updateManip()
    {
        switch(this.mode) {
            case "orbit":
                this.updateCamera(0, 0, this.deltaX, this.deltaY, 1);
                break;
            case "pan":
                this.updateCamera(this.deltaX, this.deltaY, 0, 0, 1);
                break;
            case "dolly":
                this.updateCamera(0, 0, 0, 0, this.deltaY * 0.0075 + 1);
                break;
            case "pan-dolly":
                const pinchScale = (this.deltaPinch - 1) * 0.5 + 1;
                this.updateCamera(this.deltaX, this.deltaY, 0, 0, 1 / pinchScale);
                break;
        }
    }

    setCamera(position: IOrbitPosition)
    {
        const camera = this.camera;

        _offset.copy(camera.position).sub(this.target);

        _offset.applyQuaternion(this.rotToYUp);
        _spherical.setFromVector3(_offset);

        _spherical.theta = position.head;
        _spherical.phi = position.pitch;
        _spherical.radius = position.dist;
        _spherical.makeSafe();

        _offset.setFromSpherical(_spherical);
        _offset.applyQuaternion(this.rotFromYUp);

        this.target.set(position.x, position.y, position.z);

        camera.position.copy(this.target).add(_offset);
        camera.lookAt(this.target);
    }

    getCamera(): IOrbitPosition
    {
        const camera = this.camera;
        const target = this.target;

        _offset.copy(camera.position).sub(this.target);

        _offset.applyQuaternion(this.rotToYUp);
        _spherical.setFromVector3(_offset);

        return {
            x: target.x,
            y: target.y,
            z: target.z,
            head: _spherical.theta,
            pitch: _spherical.phi,
            dist: _spherical.radius
        };
    }

    updateCamera(dX, dY, dHead, dPitch, dScale)
    {
        //console.log("updateCamera", dX, dY, dHead, dPitch, dScale);

        const viewportHeight = this.viewportHeight;
        const viewportWidth = this.viewportWidth;

        const camera = this.camera;
        const target = this.target;

        _offset.copy(camera.position).sub(this.target);

        _offset.applyQuaternion(this.rotToYUp);
        _spherical.setFromVector3(_offset);

        _spherical.theta -= dHead * math.DOUBLE_PI / viewportWidth;
        _spherical.phi -= dPitch * math.DOUBLE_PI / viewportWidth;
        _spherical.phi = math.limit(_spherical.phi, 0, math.PI);
        _spherical.makeSafe();

        _spherical.radius = math.limit(_spherical.radius * dScale, this.distanceLimits.x, this.distanceLimits.y);

        const distance = _offset.length() * Math.tan((camera.fov / 2) * math.DEG2RAD);

        _vec.setFromMatrixColumn(camera.matrix, 0);
        _vec.multiplyScalar(-2 * dX * distance / viewportHeight);
        target.add(_vec);

        _vec.setFromMatrixColumn(camera.matrix, 1);
        _vec.multiplyScalar(2 * dY * distance / viewportHeight);
        target.add(_vec);

        _offset.setFromSpherical(_spherical);
        _offset.applyQuaternion(this.rotFromYUp);

        camera.position.copy(target).add(_offset);
        camera.lookAt(this.target);
    }

    onManipBegin(event: IManipEvent)
    {
        const element = event.target as HTMLElement;
        this.viewportWidth = element.clientWidth;
        this.viewportHeight = element.clientHeight;

        this.mode = this.getModeFromEvent(event);
        this.phase = "active";

        return true;
    }

    onManipUpdate(event: IManipEvent)
    {
        if (!event.isActive) {
            return;
        }

        if (event.type === "up" || event.type === "down") {
            const mode = this.getModeFromEvent(event);
            if (mode !== this.mode) {

                if (event.type === "down") {
                    this.mode = mode;
                }
            }
        }

        this.deltaX += event.movementX;
        this.deltaY += event.movementY;

        this.deltaPinch *= event.pinchDeltaFactor;
    }

    onManipEnd(event: IManipEvent)
    {
        this.phase = "runout";
    }

    onManipEvent(event: IManipEvent)
    {
        if (event.type === "wheel") {
            this.deltaWheel += math.limit(event.wheel, -1, 1);
        }

        return true;
    }

    private getModeFromEvent(event: IManipEvent): Mode
    {
        const pointerEvent = event.pointerEvent;

        if (pointerEvent.pointerType === "mouse") {
            const button = pointerEvent.button;

            // left button
            if (button === 0) {
                if (pointerEvent.ctrlKey) {
                    return "pan";
                }
                if (pointerEvent.altKey) {
                    return "dolly";
                }

                return "orbit";
            }

            // right button
            if (button === 2) {
                return "pan";
            }

            // middle button
            if (button === 1) {
                return "dolly";
            }
        }
        else if (pointerEvent.pointerType === "touch") {

            const count = event.activePointerCount;

            if (count === 1) {
                return "orbit";
            }

            if (count === 2) {
                return "pan-dolly";
            }

            return "pan";
        }
    }
}