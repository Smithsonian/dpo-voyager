/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
    WebGLRenderer,
    WebGLRenderTarget,
    Object3D,
    Scene,
    Camera,
    Vector3,
    Box3,
    Color
} from "three";

import IndexShader from "./shaders/IndexShader";
import PositionShader from "./shaders/PositionShader";
import NormalShader from "./shaders/NormalShader";

import { IBaseEvent } from "./Viewport";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new Vector3();
const _color = new Color();

const _range = 10000;

const _pickPositionRange = new Box3(
    new Vector3(-_range, -_range, -_range),
    new Vector3(_range, _range, _range)
);

export default class GPUPicker
{
    static add(object: Object3D, recursive: boolean)
    {
        const hookObject3D = object => {
            if ((object as any).material) {
                object.onBeforeRender = function(r, s, c, g, material: IndexShader) {
                    if (material.isIndexShader) {
                        //console.log("setIndex #%s for %s", object.id, object);
                        material.setIndex(object.id);
                    }
                }
                object.onAfterRender = function(r, s, c, g, material: IndexShader) {
                    if (material.isIndexShader) {
                        material.setIndex(0);
                    }
                }
            }
        };

        if (recursive) {
            object.traverse(object => hookObject3D(object));
        }
        else {
            hookObject3D(object);
        }
    }

    static remove(object: Object3D, recursive: boolean)
    {
        const unhookObject3D = object => {
            if ((object as any).material) {
                object.onBeforeRender = null;
                object.onAfterRender = null;
            }
        };

        if (recursive) {
            object.traverse(object => unhookObject3D(object));
        }
        else {
            unhookObject3D(object);
        }
    }


    protected renderer: WebGLRenderer;

    protected pickTextures: WebGLRenderTarget[];
    protected pickBuffer: Uint8Array;

    protected indexShader: IndexShader;
    protected positionShader: PositionShader;
    protected normalShader: NormalShader;

    constructor(renderer: WebGLRenderer)
    {
        this.renderer = renderer;

        this.pickTextures = [];
        for (let i = 0; i < 3; ++i) {
            this.pickTextures[i] = new WebGLRenderTarget(1, 1, { stencilBuffer: false });
        }
        this.pickBuffer = new Uint8Array(4);

        this.indexShader = new IndexShader();
        this.positionShader = new PositionShader();
        this.normalShader = new NormalShader();
    }

    pickObject(scene: Scene, camera: Camera, event: IBaseEvent): Object3D
    {
        const index = this.pickIndex(scene, camera, event);
        if (index > 0) {
            return scene.getObjectById(index);
        }

        return undefined;
    }

    /**
     * Picks the index of the object at the position given by the event.
     * @param scene The scene containing the objects available for picking.
     * @param camera The active camera.
     * @param event A UI event providing the screen position at which to pick.
     */
    pickIndex(scene: Scene, camera: Camera, event: IBaseEvent): number
    {
        const viewport = event.viewport;
        camera = viewport.updateCamera(camera);
        camera.layers.disable(1);

        const overrideMaterial = scene.overrideMaterial;
        scene.overrideMaterial = this.indexShader;

        const renderer = this.renderer;
        const pickTexture = this.pickTextures[0];
        renderer.getClearColor(_color);

        viewport.applyPickViewport(pickTexture, event);
        renderer.setRenderTarget(pickTexture);
        renderer.setClearColor(0);

        const xrFlag = renderer.xr.enabled;
        renderer.xr.enabled = false;

        renderer.clear(); 
        renderer.render(scene, camera);
        
        renderer.xr.enabled = xrFlag;

        renderer.setRenderTarget(null);
        renderer.setClearColor(_color);

        scene.overrideMaterial = overrideMaterial;

        camera.layers.enable(1);

        const buffer = this.pickBuffer;
        renderer.readRenderTargetPixels(pickTexture, 0, 0, 1, 1, buffer);

        return buffer[0] + buffer[1] * 256 + buffer[2] * 65536;
    }

    /**
     * Picks the local position on the surface of the object at the screen position of the given UI event.
     * @param scene The scene containing the objects available for picking.
     * @param camera The active camera.
     * @param event A UI event providing the screen position at which to pick.
     * @param range Optional range for the possible position values to be picked. Can be omitted. If given, should
     * be set to the local bounding box of the object whose position is picked.
     * @param result A vector containing the picked position in object-local coordinates.
     */
    pickPosition(scene: Scene, camera: Camera,
        event: IBaseEvent, range?: Box3, result?: Vector3): Vector3
    {
        range = range || _pickPositionRange;
        result = result || new Vector3();

        const viewport = event.viewport;
        camera = viewport.updateCamera(camera);
        camera.layers.disable(1);

        const overrideMaterial = scene.overrideMaterial;
        const shader = scene.overrideMaterial = this.positionShader;

        const renderer = this.renderer;
        const pickTextures = this.pickTextures;
        renderer.getClearColor(_color);
        renderer.setClearColor(0);

        for (let i = 0; i < 3; ++i) {
            shader.uniforms.index.value = i;
            shader.uniforms.range.value[0] = range.min.getComponent(i);
            shader.uniforms.range.value[1] = range.max.getComponent(i);
            viewport.applyPickViewport(pickTextures[i], event);
            renderer.setRenderTarget(pickTextures[i]);
            renderer.clear();
            renderer.render(scene, camera);
        }

        renderer.setRenderTarget(null);
        renderer.setClearColor(_color);

        scene.overrideMaterial = overrideMaterial;

        camera.layers.enable(1);

        const buffer = this.pickBuffer;

        for (let i = 0; i < 3; ++i) {
            renderer.readRenderTargetPixels(pickTextures[i], 0, 0, 1, 1, buffer);
            result.setComponent(i,
                  buffer[3] * 2.337437050015319e-10 /* / 255 / 16777216 */
                + buffer[2] * 5.983838848039216e-8 /* / 255 / 65536 */
                + buffer[1] * 1.531862745098039e-5 /* / 255 / 256 */
                + buffer[0] * 0.003921568627451 /* / 255 */
            );
        }

        range.getSize(_vec3);
        return result.multiply(_vec3).add(range.min);
    }

    /**
     * Picks the surface normal of the object at the screen position of the given UI event.
     * @param scene The scene containing the objects available for picking.
     * @param camera The active camera.
     * @param event A UI event providing the screen position at which to pick.
     * @param result A vector containing the picked normal in object-local coordinates.
     */
    pickNormal(scene: Scene, camera: Camera,
            event: IBaseEvent, result?: Vector3): Vector3
    {
        result = result || new Vector3();

        const viewport = event.viewport;
        camera = viewport.updateCamera(camera);
        camera.layers.disable(1);

        const overrideMaterial = scene.overrideMaterial;
        scene.overrideMaterial = this.normalShader;

        const renderer = this.renderer;
        const pickTexture = this.pickTextures[0];
        renderer.getClearColor(_color);

        viewport.applyPickViewport(pickTexture, event);
        renderer.setRenderTarget(pickTexture);
        renderer.setClearColor(0);
        renderer.clear();
        renderer.render(scene, camera);

        renderer.setRenderTarget(null);
        renderer.setClearColor(_color);

        scene.overrideMaterial = overrideMaterial;

        camera.layers.enable(1);

        const buffer = this.pickBuffer;

        renderer.readRenderTargetPixels(pickTexture, 0, 0, 1, 1, buffer);
        return result.set(
            buffer[0] / 255 * 2 - 1,
            buffer[1] / 255 * 2 - 1,
            buffer[2] / 255 * 2 - 1
        ).normalize();
    }
}