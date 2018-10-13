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
import { IManipPointerEvent, IManipTriggerEvent } from "@ff/react/ManipTarget";

////////////////////////////////////////////////////////////////////////////////

const _pi2 = Math.PI * 0.5;

const _cameraRotation = {
    left: new THREE.Vector3(0, -_pi2, 0),
    right: new THREE.Vector3(0, _pi2, 0),
    top: new THREE.Vector3(-_pi2, 0, 0),
    bottom: new THREE.Vector3(_pi2, 0, 0),
    front: new THREE.Vector3(0, 0, 0),
    back: new THREE.Vector3(0, 0, Math.PI),
};

const _cameraPosition = {
    left: new THREE.Vector3(-5000, 0, 0),
    right: new THREE.Vector3(5000, 0, 0),
    top: new THREE.Vector3(0, 5000, 0),
    bottom: new THREE.Vector3(0, -5000, 0),
    front: new THREE.Vector3(0, 0, 5000),
    back: new THREE.Vector3(0, 0, -5000),
};

export type ViewportCameraView = "left" | "right" | "top" | "bottom" | "front" | "back";
export type ViewportCameraType = "perspective" | "orthographic";
export type ViewportCameraSource = "scene" | "viewport";

export interface IViewportPointerEvent extends IManipPointerEvent
{
    viewport?: Viewport;
    deviceX?: number;
    deviceY?: number;
}

export interface IViewportTriggerEvent extends IManipTriggerEvent
{
    viewport?: Viewport;
    deviceX?: number;
    deviceY?: number;
}

export default class Viewport
{
    x: number;
    y: number;
    width: number;
    height: number;
    relative: boolean;
    changed: boolean;

    canvasWidth: number;
    canvasHeight: number;
    sceneCamera: THREE.Camera;

    private _vpX: number;
    private _vpY: number;
    private _vpWidth: number;
    private _vpHeight: number;

    private _cameraSource: ViewportCameraSource;
    private _vpCamera: THREE.Camera;


    constructor(x: number = 0, y: number = 0, width: number = 1, height: number = 1, relative: boolean = true)
    {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.relative = relative;
        this.changed = true;

        this.canvasWidth = 100;
        this.canvasHeight = 100;
        this.sceneCamera = null;

        this._cameraSource = "viewport";
        this._vpCamera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.001, 10000);

        this.updateViewport();
    }

    get camera(): THREE.Camera | null
    {
        return this._cameraSource === "viewport" ? this._vpCamera : this.sceneCamera;
    }

    apply(renderer: THREE.WebGLRenderer): THREE.Camera
    {
        renderer.setViewport(this._vpX, this._vpY, this._vpWidth, this._vpHeight);

        const camera = this.camera;
        this.updateCameraAspect(camera, this._vpWidth / this._vpHeight);

        return camera;
    }

    render(renderer: THREE.WebGLRenderer, scene: THREE.Scene)
    {
        const camera = this.apply(renderer);
        renderer.render(scene, camera);
    }

    setCamera(source: ViewportCameraSource, type?: ViewportCameraType, view?: ViewportCameraView): this
    {
        this.setCameraSource(source);
        if (type) {
            this.setCameraType(type);
        }
        if (view) {
            this.setCameraView(view);
        }
        return this;
    }

    setCameraSource(source: ViewportCameraSource)
    {
        this._cameraSource = source;
    }

    setCameraType(type: ViewportCameraType)
    {
        const camera = this._vpCamera;
        const position = camera.position;
        const quaternion = camera.quaternion;

        if (type === "perspective" && camera.type === "OrthographicCamera") {
            const orthoCam = camera as THREE.OrthographicCamera;
            this._vpCamera = new THREE.PerspectiveCamera(45, 1, orthoCam.near, orthoCam.far);
        }
        else if (type === "orthographic" && camera.type === "PerspectiveCamera") {
            const perspCam = camera as THREE.PerspectiveCamera;
            this._vpCamera = new THREE.OrthographicCamera(-10, 10, 10, -10, perspCam.near, perspCam.far);
        }

        this._vpCamera.position.copy(position);
        this._vpCamera.quaternion.copy(quaternion);
    }

    setCameraView(view: ViewportCameraView)
    {
        this._vpCamera.rotation.setFromVector3(_cameraRotation[view]);
        this._vpCamera.position.copy(_cameraPosition[view]);
    }

    set(x: number = 0, y: number = 0, width: number = 1, height: number = 1)
    {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.updateViewport();
    }

    isPointInside(x: number, y: number): boolean
    {
        return x >= this._vpX && x < this._vpX + this._vpWidth
            && y >= this._vpY && y < this._vpY + this._vpHeight;
    }

    getDeviceCoords(x: number, y: number, result?: THREE.Vector2): THREE.Vector2
    {
        const ndx = ((x - this._vpX) / this._vpWidth) * 2 - 1;
        const ndy = 1 - ((y - this._vpY) / this._vpHeight) * 2;
        //console.log(this._vpX, this._vpY, this._vpWidth, this._vpHeight);
        //console.log(x, y, ndx, ndy);
        return result ? result.set(ndx, ndy) : new THREE.Vector2(ndx, ndy);
    }

    setCanvasSize(width: number, height: number)
    {
        this.canvasWidth = width;
        this.canvasHeight = height;

        this.updateViewport();
    }

    protected updateViewport()
    {
        if (this.relative) {
            this._vpX = this.x * this.canvasWidth;
            this._vpY = this.y * this.canvasHeight;
            this._vpWidth = this.width * this.canvasWidth;
            this._vpHeight = this.height * this.canvasHeight;
        }
        else {
            this._vpX = this.x;
            this._vpY = this.y;
            this._vpWidth = this.width;
            this._vpHeight = this.height;
        }
    }

    protected updateCameraAspect(camera: THREE.Camera, aspect: number)
    {
        if (camera.userData["aspect"] !== aspect) {
            camera.userData["aspect"] = aspect;
            if (camera.type === "PerspectiveCamera") {
                const perspCam = camera as THREE.PerspectiveCamera;
                perspCam.aspect = aspect;
                perspCam.updateProjectionMatrix();
            }
            else if (camera.type === "OrthographicCamera") {
                const orthoCam = camera as THREE.OrthographicCamera;
                const halfSize = (orthoCam.top - orthoCam.bottom) * 0.5 * aspect;
                orthoCam.left = -halfSize;
                orthoCam.right = halfSize;
                orthoCam.updateProjectionMatrix();
            }
        }
    }
}