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
import OrbitManip from "@ff/react/OrbitManip";
import OrbitController from "@ff/three/OrbitController";

////////////////////////////////////////////////////////////////////////////////

const _pi2 = Math.PI * 0.5;

const _cameraOrientation = [
    new THREE.Vector3(0, -_pi2, 0),
    new THREE.Vector3(0, _pi2, 0),
    new THREE.Vector3(_pi2, 0, 0),
    new THREE.Vector3(-_pi2, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, Math.PI),
];

export enum EViewportCameraView { Left, Right, Top, Bottom, Front, Back }
export enum EViewportCameraType { Perspective, Orthographic }


export interface IViewportPointerEvent extends IManipPointerEvent
{
    viewport: Viewport | null;
    deviceX: number;
    deviceY: number;
}

export interface IViewportTriggerEvent extends IManipTriggerEvent
{
    viewport: Viewport | null;
    deviceX: number;
    deviceY: number;
}

export default class Viewport
{
    x = 0;
    y = 0;
    width = 100;
    height = 100;

    index = 0;
    changed = true;

    canvasWidth = 100;
    canvasHeight = 100;

    sceneCamera: THREE.Camera = null;
    useSceneCamera = true;

    private _x: number;
    private _y: number;
    private _width: number;
    private _height: number;

    private vpCamera: THREE.Camera;
    private vpManip: OrbitManip;
    private vpController: OrbitController;


    constructor(x?: number, y?: number, width?: number, height?: number)
    {
        this._x = x || 0;
        this._y = y || 0;
        this._width = width !== undefined ? width : 1;
        this._height = height !== undefined ? height : 1;

        this.vpCamera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.001, 10000);

        this.vpManip = new OrbitManip();
        this.vpController = new OrbitController();
    }

    get camera(): THREE.Camera | null
    {
        return this.useSceneCamera ? this.sceneCamera : this.vpCamera;
    }

    apply(renderer: THREE.WebGLRenderer): THREE.Camera
    {
        renderer.setViewport(this.x, this.y, this.width, this.height);

        const camera = this.camera;
        this.updateCameraAspect(camera, this.width / this.height);

        return camera;
    }

    render(renderer: THREE.WebGLRenderer, scene: THREE.Scene)
    {
        const camera = this.apply(renderer);
        renderer.render(scene, camera);
    }

    updateCamera(force?: boolean)
    {
        const delta = this.vpManip.getDeltaPose();

        if (delta || force) {
            const controller = this.vpController;
            controller.update(delta);

            const orthoCam = this.vpCamera as THREE.OrthographicCamera;
            controller.toMatrix(orthoCam.matrix);
            orthoCam.matrixWorldNeedsUpdate = true;

            if (orthoCam.isOrthographicCamera) {
                const aspect = orthoCam.userData["aspect"];
                const hs = controller.size * 0.5;
                orthoCam.top = hs;
                orthoCam.bottom = -hs;
                orthoCam.left = -hs * aspect;
                orthoCam.right = hs * aspect;
                orthoCam.updateProjectionMatrix();
            }
        }
    }

    setCamera(type: EViewportCameraType, view: EViewportCameraView): this
    {
        this.useSceneCamera = false;

        this.setCameraType(type);
        this.setCameraView(view);
        return this;
    }

    setCameraType(type: EViewportCameraType)
    {
        const camera = this.vpCamera;

        if (camera) {
            this.vpController.fromMatrix(camera.matrix);
        }

        if (type === EViewportCameraType.Perspective) {
            this.vpCamera = new THREE.PerspectiveCamera(45, 1, 0.001, 10000);
            this.vpController.orthographicMode = false;
        }
        else if (type === EViewportCameraType.Orthographic) {
            this.vpCamera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.001, 10000);
            this.vpController.orthographicMode = true;
            this.vpController.orientationEnabled = false;
        }

        this.vpCamera.matrixAutoUpdate = false;
        this.updateCamera(true);
    }

    setCameraView(view: EViewportCameraView)
    {
        this.vpController.orientation.copy(_cameraOrientation[view]);
        this.vpController.offset.set(0, 0, 1000);

        this.vpController.toMatrix(this.vpCamera.matrix);
        this.vpCamera.matrixWorldNeedsUpdate = true;
    }

    set(x: number = 0, y: number = 0, width: number = 1, height: number = 1): this
    {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;

        this.updateViewport();
        return this;
    }

    isPointInside(x: number, y: number): boolean
    {
        return x >= this.x && x < this.x + this.width
            && y >= this.y && y < this.y + this.height;
    }

    getDeviceCoords(x: number, y: number, result?: THREE.Vector2): THREE.Vector2
    {
        const ndx = ((x - this.x) / this.width) * 2 - 1;
        const ndy = 1 - ((y - this.y) / this.height) * 2;

        return result ? result.set(ndx, ndy) : new THREE.Vector2(ndx, ndy);
    }

    setCanvasSize(width: number, height: number)
    {
        this.canvasWidth = width;
        this.canvasHeight = height;

        this.updateViewport();
    }

    onPointer(event: IViewportPointerEvent)
    {
        return this.vpManip.onPointer(event);
    }

    onTrigger(event: IViewportTriggerEvent)
    {
        return this.vpManip.onTrigger(event);
    }

    protected updateViewport()
    {
        this.x = this._x * this.canvasWidth;
        this.y = this._y * this.canvasHeight;
        this.width = this._width * this.canvasWidth;
        this.height = this._height * this.canvasHeight;

        this.vpController.setViewportSize(this.width, this.height);
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