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

//import resolvePathname from "resolve-pathname";
import UberPBRAdvMaterial from "client/shaders/UberPBRAdvMaterial";
import { LoadingManager, Object3D, Scene, Group, Mesh, MeshStandardMaterial, sRGBEncoding, SRGBColorSpace, MeshPhysicalMaterial } from "three";

import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

import UberPBRMaterial from "../shaders/UberPBRMaterial";

////////////////////////////////////////////////////////////////////////////////

const DEFAULT_DRACO_PATH = "https://www.gstatic.com/draco/versioned/decoders/1.5.6/";

export default class ModelReader
{
    static readonly extensions = [ "gltf", "glb" ];
    static readonly mimeTypes = [ "model/gltf+json", "model/gltf-binary" ];

    protected loadingManager: LoadingManager;
    protected gltfLoader;

    protected customDracoPath = null;

    set dracoPath(path: string) 
    {
        this.customDracoPath = path;
        if(this.gltfLoader.dracoLoader !== null) {
            this.gltfLoader.dracoLoader.setDecoderPath(this.customDracoPath);
        }
    }
   
    constructor(loadingManager: LoadingManager)
    {
        this.loadingManager = loadingManager;

        //const dracoPath = resolvePathname("js/draco/", window.location.origin + window.location.pathname);

        if (ENV_DEVELOPMENT) {
            console.log("ModelReader.constructor - DRACO path: %s", this.customDracoPath || DEFAULT_DRACO_PATH);
        }

        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath(this.customDracoPath || DEFAULT_DRACO_PATH);

        this.gltfLoader = new GLTFLoader(loadingManager);
        this.gltfLoader.setDRACOLoader(dracoLoader);
    }

    dispose()
    {
        this.gltfLoader.dracoLoader.dispose();
        this.gltfLoader.setDRACOLoader(null);
        this.gltfLoader = null;
    }

    isValid(url: string): boolean
    {
        const extension = url.split(".").pop().toLowerCase();
        return ModelReader.extensions.indexOf(extension) >= 0;
    }

    isValidMimeType(mimeType: string): boolean
    {
        return ModelReader.mimeTypes.indexOf(mimeType) >= 0;
    }

    get(url: string): Promise<Object3D>
    {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(url, gltf => {
                resolve(this.createModelGroup(gltf));
            }, null, error => {
                if(this.gltfLoader === null || this.gltfLoader.dracoLoader === null) {
                    // HACK to avoid errors when component is removed while loading still in progress.
                    // Remove once Three.js supports aborting requests again.
                    resolve(null);
                }
                else {
                    console.error(`failed to load '${url}': ${error}`);
                    reject(new Error(error));
                }
            })
        });
    }

    protected createModelGroup(gltf): Object3D
    {
        const scene: Scene = gltf.scene;

        scene.traverse((object: any) => {
            if (object.type === "Mesh") {
                const mesh: Mesh = object;
                mesh.castShadow = true;
                const material = mesh.material as MeshStandardMaterial;

                if (material.map) {
                   material.map.colorSpace = SRGBColorSpace;
                }

                mesh.geometry.computeBoundingBox();

                const uberMat = material.type === "MeshPhysicalMaterial" ? new UberPBRAdvMaterial() : new UberPBRMaterial();

                if (material.flatShading) {
                    mesh.geometry.computeVertexNormals();
                    material.flatShading = false;
                    console.warn("Normals unavailable so they have been calculated. For best outcomes, please provide normals with geometry.");
                }

                // copy properties from previous material
                if (material.type === "MeshPhysicalMaterial" || material.type === "MeshStandardMaterial") {
                    uberMat.copy(material);
                }

                // check if the material's normal map uses object space (indicated in glTF extras)
                if (material.userData["objectSpaceNormals"]) {
                    uberMat.enableObjectSpaceNormalMap(true);

                    if (ENV_DEVELOPMENT) {
                        console.log("ModelReader.createModelGroup - objectSpaceNormals: ", true);
                    }
                }

                mesh.material = uberMat;
            }
        });

        return scene;
    }
}