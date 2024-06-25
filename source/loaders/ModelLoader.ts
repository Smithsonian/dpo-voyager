/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import resolvePathname from "resolve-pathname";

import {
    Group,
} from "three";

import GLTFLoader from "three/examples/js/loaders/GLTFLoader";
import DRACOLoader from "three/examples/js/loaders/DRACOLoader";

import Loader from "./Loader";

////////////////////////////////////////////////////////////////////////////////

/**
 * Extended Three.js glTF loader with built-in DRACO mesh compression support.
 */
export default class ModelLoader extends Loader
{
    static readonly assetType = "model";
    static readonly extensions = [ "gltf", "glb" ];

    static readonly dracoPath: string = "js/draco/";

    protected gltfLoader;


    constructor(loadingManager: THREE.LoadingManager)
    {
        super(loadingManager);

        const dracoUrl = resolvePathname(ModelLoader.dracoPath, window.location.origin + window.location.pathname);
        DRACOLoader.setDecoderPath(dracoUrl);

        if (ENV_DEVELOPMENT) {
            console.log("ModelLoader.constructor - DRACO library path: %s", dracoUrl);
        }

        this.gltfLoader = new GLTFLoader(loadingManager);
        this.gltfLoader.setDRACOLoader(new DRACOLoader());
    }

    async load(url: string): Promise<THREE.Object3D>
    {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(url, gltf => {
                const scene: THREE.Scene = gltf.scene;
                if (scene.type !== "Scene") {
                    throw new Error("not a valid gltf scene");
                }

                const model = new Group();
                scene.children.forEach(child => model.add(child));
                resolve(model);

            }, null, error => {
                console.error(`failed to load '${url}': ${error}`);
                reject(new Error(error));
            })
        });
    }
}