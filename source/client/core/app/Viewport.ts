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

import Grid from "../three/Grid";

////////////////////////////////////////////////////////////////////////////////

const _pi2 = Math.PI * 0.5;
const _vec3 = new THREE.Vector3();

const _cameraOrientation = [
    new THREE.Vector3(0, -_pi2, 0),
    new THREE.Vector3(0, _pi2, 0),
    new THREE.Vector3(_pi2, 0, 0),
    new THREE.Vector3(-_pi2, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, Math.PI),
];

const _gridOrientation = [
    new THREE.Vector3(_pi2, -_pi2, 0),
    new THREE.Vector3(_pi2, _pi2, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(Math.PI, 0, 0),
    new THREE.Vector3(_pi2, 0, 0),
    new THREE.Vector3(_pi2, Math.PI, 0),
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

    viewportCameraView: EViewportCameraView;
    sceneCamera: THREE.Camera = null;
    useSceneCamera = true;

    private _x: number;
    private _y: number;
    private _width: number;
    private _height: number;

    protected vpCamera: THREE.Camera;
    protected vpObjects: THREE.Group;
    protected homeGrid: Grid;
    protected vpManip: OrbitManip;
    protected vpController: OrbitController;


    constructor(x?: number, y?: number, width?: number, height?: number)
    {
        this._x = x || 0;
        this._y = y || 0;
        this._width = width !== undefined ? width : 1;
        this._height = height !== undefined ? height : 1;

        this.vpCamera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.001, 10000);
        this.vpObjects = new THREE.Group();
        this.vpObjects.matrixAutoUpdate = false;

        this.homeGrid = new Grid({
            size: 20,
            mainDivisions: 2,
            subDivisions: 10,
            mainColor: "#4d7a99",
            subColor: "#32424d"
        });

        this.homeGrid.matrixAutoUpdate = false;

        this.vpManip = new OrbitManip();
        this.vpController = new OrbitController();
    }

    get camera(): THREE.Camera | null
    {
        return this.useSceneCamera ? this.sceneCamera : this.vpCamera;
    }

    enableHomeGrid(state: boolean)
    {
        if (state) {
            this.vpObjects.add(this.homeGrid);
        }
        else {
            this.vpObjects.remove(this.homeGrid);
        }
    }

    getTranslationFactor(): number
    {
        const camera = this.camera;
        if (camera.type === "PerspectiveCamera") {
            const perspCam = camera as THREE.PerspectiveCamera;
            return 20 / this.width;
        }

        const orthoCam = camera as THREE.OrthographicCamera;
        return (orthoCam.right - orthoCam.left) / this.width;
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
        scene.add(this.vpObjects);
        scene.userData["viewport"] = this;
        renderer.render(scene, camera);
        scene.remove(this.vpObjects);
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
        this.viewportCameraView = view;
        this.vpController.orientation.copy(_cameraOrientation[view]);
        this.vpController.offset.set(0, 0, 1000);
        this.vpController.size = 25;

        this.vpController.toMatrix(this.vpCamera.matrix);
        //this.vpCamera.matrixWorldNeedsUpdate = true;
        this.updateCamera(true);

        const grid = this.homeGrid;
        grid.rotation.setFromVector3(_gridOrientation[view], "YXZ");
        grid.updateMatrix();
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

    addObject(object: THREE.Object3D)
    {
        this.vpObjects.add(object);
    }

    removeObject(object: THREE.Object3D)
    {
        this.vpObjects.remove(object);
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

    getScreenCoords(ndc: THREE.Vector3, result?: THREE.Vector2)
    {
        const x = this.x + (ndc.x + 1) * 0.5 * this.width;
        const y = this.y + (1 - ndc.y) * 0.5 * this.height;

        return result ? result.set(x, y) : new THREE.Vector2(x, y);
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