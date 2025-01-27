/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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
import { LoadingManager, Object3D, Scene, Mesh, MeshStandardMaterial, SRGBColorSpace, LoaderUtils } from "three";

import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {MeshoptDecoder} from "three/examples/jsm/libs/meshopt_decoder.module.js";
import {GLTF, GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

import UberPBRMaterial from "../shaders/UberPBRMaterial";
import CRenderer from "@ff/scene/components/CRenderer";
import { DEFAULT_SYSTEM_ASSET_PATH } from "client/components/CVAssetReader";
import { disposeObject } from "@ff/three/helpers";

////////////////////////////////////////////////////////////////////////////////

export default class ModelReader
{
    static readonly extensions = [ "gltf", "glb" ];
    static readonly mimeTypes = [ "model/gltf+json", "model/gltf-binary" ];

    protected loadingManager: LoadingManager;
    protected renderer: CRenderer;
    protected gltfLoader :GLTFLoader;

    protected loading :Record<string, {listeners : {onload: (data:ArrayBuffer)=>any, onerror: (e:Error)=>any, signal:AbortSignal}[], abortController :AbortController}> = {}

    protected customDracoPath = null;

    set dracoPath(path: string) 
    {
        this.customDracoPath = path;
        if(this.gltfLoader.dracoLoader !== null) {
            this.gltfLoader.dracoLoader.setDecoderPath(this.customDracoPath);
        }
    }


    setAssetPath(path: string){
        path = path.endsWith("/")? path.slice(0, -1):path;
        if(!this.customDracoPath) this.dracoPath = `${path}/js/draco/`;

        /** 
         * GLTFLoader.ktx2Loader has been here for a long time but only added to types definitions in r165
         * We wait until now to require it because renderer.views is not defined until after update
         */
        ((this.gltfLoader as any).ktx2Loader as KTX2Loader).setTranscoderPath(`${path}/js/basis/`);
    }

    constructor(loadingManager: LoadingManager, renderer: CRenderer)
    {
        this.loadingManager = loadingManager;

        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath(DEFAULT_SYSTEM_ASSET_PATH + "/js/draco/");
        this.renderer = renderer;
        this.gltfLoader = new GLTFLoader(loadingManager);
        this.gltfLoader.setDRACOLoader(dracoLoader);
        this.gltfLoader.setMeshoptDecoder(MeshoptDecoder);
        const ktx2Loader = new KTX2Loader(loadingManager);
        ktx2Loader.setTranscoderPath(DEFAULT_SYSTEM_ASSET_PATH + "/js/basis/");
        this.gltfLoader.setKTX2Loader(ktx2Loader);
        setTimeout(()=>{
            //Allow an update to happen. @todo check how robust it is
            ktx2Loader.detectSupport(this.renderer.views[0].renderer);
        }, 0);
    }

    dispose()
    {
        this.gltfLoader.dracoLoader.dispose();
        ((this.gltfLoader as any).ktx2Loader as KTX2Loader).dispose();   // TODO: Update type definitions for loader access
        this.gltfLoader.setDRACOLoader(null);
        this.gltfLoader.setKTX2Loader(null);
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

    get(url: string, {signal}:{signal?:AbortSignal}={}): Promise<Object3D>
    {
        this.loadingManager.itemStart(url);
        let resourcePath = LoaderUtils.extractUrlBase( url );
        return this.loadModel(url, {signal})
        .then(data=>this.gltfLoader.parseAsync(data, resourcePath))
        .then(gltf=>this.createModelGroup(gltf, {signal}))
        .catch((e)=> {
            this.loadingManager.itemError(url);
            throw e;
        }).finally(()=> this.loadingManager.itemEnd( url ));
    }

    /**
     * 
     * extracted from GLTFLoader https://github.com/mrdoob/three.js/blob/master/examples/jsm/loaders/GLTFLoader.js#L186
     * Adds an abort capability  while waiting for [THREE.js #23070](https://github.com/mrdoob/three.js/pull/23070)
     * This implementation does not quite match what is proposed there because it allows _some_ duplicate requests to be aborted without aborting the `fetch` 
     */
    async loadModel( url :string, {signal} :{signal?:AbortSignal}={}) :Promise<ArrayBuffer>{

		// Tells the LoadingManager to track an extra item, which resolves after
		// the model is fully loaded. This means the count of items loaded will
		// be incorrect, but ensures manager.onLoad() does not fire early.
        if(signal){
            const onAbort = ()=>{
                const idx = this.loading[url]?.listeners.findIndex(l=>l.signal === signal) ?? -1;
                if(idx == -1) return;
                const {onerror} = this.loading[url].listeners.splice(idx, 1)[0];
                onerror(new DOMException(signal.reason, "AbortError"));
    
                if(this.loading[url].listeners.length == 0){
                    ENV_DEVELOPMENT && console.debug("Abort request for URL : ", url);
                    this.loading[url].abortController.abort();
                }else{
                    ENV_DEVELOPMENT && console.debug("Abort listener for URL : %s (%d)", url, this.loading[url].listeners.length );
                }
            }
            signal.addEventListener("abort", onAbort);
        }

        if(!this.loading[url]?.listeners.length){
    
            this.loading[url] = {listeners:[], abortController: new AbortController()};
    
            fetch(url, {
                signal: this.loading[url].abortController.signal,
            }).then(r=>{
                if(!r.ok){
                    throw new Error( `fetch for "${r.url}" responded with ${r.status}: ${r.statusText}`);
                }
                //Skip all the progress tracking from FileLoader since we don't use it.
                return r.arrayBuffer();
            }).then(data=> {
                this.loading[url].listeners.forEach(({onload})=>onload(data));
            }, (e)=>{
                this.loading[url].listeners.forEach(({onerror})=>onerror(e));
                if(e.name != "AbortError" && e.name != "ABORT_ERR"){
                    console.error(e);
                }
            }).finally(()=>{
                delete this.loading[url];
            });
        }

        return new Promise((onload, onerror)=>{
            this.loading[url].listeners.push({onload, onerror, signal});
        });
	}

    protected async createModelGroup(gltf :GLTF, {signal}:{signal?:AbortSignal}={}): Promise<Object3D>
    {
        if(signal.aborted) throw new DOMException(signal.reason, "AbortError");
        const scene = gltf.scene;

        scene.traverse((object: any) => {
            if (object.type === "Mesh") {
                const mesh: Mesh = object;
                mesh.castShadow = true;
                const material = mesh.material as MeshStandardMaterial;

                if (material.map) {
                   material.map.colorSpace = SRGBColorSpace;
                }

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

        try {
            await this.renderer.views[0].renderer.compileAsync(scene, this.renderer.activeCamera, this.renderer.activeScene);
            if(signal.aborted) throw new DOMException(signal.reason, "AbortError");
        }
        catch(e) {
            try {
                disposeObject(scene);
            }
            catch(e) {
                console.warn("Failed to dispose of cancelled glTF scene", e);
            }
            throw e;
        }
        return scene;
    }
}