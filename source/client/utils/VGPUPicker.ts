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

import {WebGLRenderer, Scene, Vector3, Camera, Texture, Color} from 'three';
import GPUPicker from "@ff/three/GPUPicker";
import { IBaseEvent } from "@ff/three/Viewport";

import UVShader from "../shaders/UVShader";
import ZoneShader from "../shaders/ZoneShader";

const _color = new Color();

export default class VGPUPicker extends GPUPicker
{
    protected uvShader: UVShader;
    protected zoneShader: ZoneShader;

    constructor(renderer: WebGLRenderer)
    {
        super(renderer);

        this.uvShader = new UVShader();
        this.zoneShader = new ZoneShader();
    }

    /**
     * Picks the uv coordinates on the surface of the object at the screen position of the given UI event.
     * @param scene The scene containing the objects available for picking.
     * @param camera The active camera.
     * @param event A UI event providing the screen position at which to pick.
     * @param result A vector containing the picked uv coordinates.
     */
    pickUV(scene: Scene, camera: Camera,
        event: IBaseEvent, result?: Vector3): Vector3
    {
        result = result || new Vector3();

        const viewport = event.viewport;
        camera = viewport.updateCamera(camera);
        camera.layers.disable(1);

        const overrideMaterial = scene.overrideMaterial;
        const shader = scene.overrideMaterial = this.uvShader;

        const renderer = this.renderer;
        const pickTextures = this.pickTextures;
        renderer.getClearColor(_color);

        for (let i = 0; i < 2; ++i) {
            shader.uniforms.index.value = i;
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

        return result;
    }


    /**
     * Picks the color value from the zone texture at the screen position of the given UI event.
     * @param scene The scene containing the objects available for picking.
     * @param texture The zone texture to pick from
     * @param camera The active camera.
     * @param event A UI event providing the screen position at which to pick.
     * @param result A vector containing the picked uv coordinates.
     */
    pickZone(scene: Scene, texture: Texture, camera: Camera,
        event: IBaseEvent, result?: Vector3): Vector3
    {
        result = result || new Vector3();

        const viewport = event.viewport;
        camera = viewport.updateCamera(camera);
        camera.layers.disable(1);

        const overrideMaterial = scene.overrideMaterial;
        const shader = scene.overrideMaterial = this.zoneShader;

        const renderer = this.renderer;
        const pickTexture = this.pickTextures[0];
        renderer.getClearColor(_color);

        shader.uniforms.zoneMap.value = texture;
        viewport.applyPickViewport(pickTexture, event);
        renderer.setRenderTarget(pickTexture);
        renderer.clear();
        renderer.render(scene, camera);

        renderer.setRenderTarget(null);
        renderer.setClearColor(_color);

        scene.overrideMaterial = overrideMaterial;
        camera.layers.enable(1);

        const buffer = this.pickBuffer;

        renderer.readRenderTargetPixels(pickTexture, 0, 0, 1, 1, buffer);
        return result.set(
            buffer[0], buffer[1], buffer[2]
        )
    }
}