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
import { LoadingManager, Object3D, Scene, Mesh, MeshStandardMaterial, SRGBColorSpace } from "three";

import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {MeshoptDecoder} from "three/examples/jsm/libs/meshopt_decoder.module.js";
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

import UberPBRMaterial from "../shaders/UberPBRMaterial";
import CRenderer from "@ff/scene/components/CRenderer";
import { DEFAULT_SYSTEM_ASSET_PATH } from "client/components/CVAssetReader";
import UberBasicMaterial from "client/shaders/UberBasicMaterial";

////////////////////////////////////////////////////////////////////////////////

export default class ModelReader
{
    static readonly extensions = [ "gltf", "glb" ];
    static readonly mimeTypes = [ "model/gltf+json", "model/gltf-binary" ];

    protected loadingManager: LoadingManager;
    protected renderer: CRenderer;
    protected gltfLoader :GLTFLoader;

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
        const ktx2Loader = new KTX2Loader(this.loadingManager);
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
                    reject(new Error(error as any));
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

                const uberMat = material.type === "MeshPhysicalMaterial" ? new UberPBRAdvMaterial() : 
                    material.type === "MeshBasicMaterial" ? new UberBasicMaterial() : new UberPBRMaterial();

                // update default shaders for extended functionality
                uberMat.onBeforeCompile = (shader) => {
                    shader.vertexShader = this.injectVertexShaderCode(shader.vertexShader);
                    shader.fragmentShader = this.injectFragmentShaderCode(shader.fragmentShader);
                }
                
                if (material.flatShading) {
                    mesh.geometry.computeVertexNormals();
                    material.flatShading = false;
                    console.warn("Normals unavailable so they have been calculated. For best outcomes, please provide normals with geometry.");
                }

                // copy properties from previous material
                if (material.type === "MeshPhysicalMaterial" || material.type === "MeshStandardMaterial" || material.type === "MeshBasicMaterial") {
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

    protected injectVertexShaderCode(shader: string) : string {
        shader = shader.replace(
            '#include <common>',
            '// Zone map support\n \
            #if defined(USE_ZONEMAP)\n \
                varying vec2 vZoneUv;\n \
            #endif\n \
            \n \
            #ifdef MODE_XRAY\n \
                varying float vIntensity;\n \
            #endif\n \
            \n \
            #if defined(CUT_PLANE) && !defined(USE_TRANSMISSION)\n \
                varying vec3 vWorldPosition;\n \
            #endif\n \
            #include <common>'
        )

        shader = shader.replace(
            '#include <uv_vertex>',
            '#include <uv_vertex>\n \
            \n \
            // Zone map support\n \
            #if defined(USE_ZONEMAP)\n \
                #if defined(USE_MAP)\n \
                    vZoneUv = (mapTransform * vec3(vMapUv, 1)).xy;\n \
                #else\n \
                    vZoneUv = uv;\n \
                #endif\n \
            #endif'
        )

        shader = shader.replace(
            '#include <worldpos_vertex>',
            '#if defined(USE_ENVMAP) || defined(DISTANCE) || defined(USE_SHADOWMAP) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0 || defined(CUT_PLANE)\n \
                vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );\n \
            #endif'
        )

        shader = shader.slice(0,shader.lastIndexOf('}')).concat(
            '\n \
            #ifdef CUT_PLANE\n \
                vWorldPosition = worldPosition.xyz / worldPosition.w;\n \
            #endif\n \
            \n \
            #ifdef MODE_NORMALS\n \
                vNormal = normal;\n \
            #endif\n \
            \n \
            #ifdef MODE_XRAY\n \
                vIntensity = pow(abs(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)))), 3.0);\n \
            #endif\n \
            }'
        )

        return shader;
    }

    protected injectFragmentShaderCode(shader: string) {
        shader = shader.slice(0,shader.lastIndexOf('}')).concat(
            '\n \
            #ifdef MODE_NORMALS\n \
                gl_FragColor = vec4(vec3(normal * 0.5 + 0.5), 1.0);\n \
            #endif\n \
            \n \
            #ifdef MODE_XRAY\n \
                gl_FragColor = vec4(vec3(0.4, 0.7, 1.0) * vIntensity, 1.0);\n \
            #endif\n \
            }'
        )

        shader = shader.replace(
            'void main() {',
            '// Zone map support\n \
            #if defined(USE_ZONEMAP)\n \
                varying vec2 vZoneUv;\n \
                uniform sampler2D zoneMap;\n \
            #endif\n \
            \n \
            #ifdef USE_AOMAP\n \
                uniform vec3 aoMapMix;\n \
            #endif\n \
            \n \
            #ifdef MODE_XRAY\n \
                varying float vIntensity;\n \
            #endif\n \
            \n \
            #ifdef CUT_PLANE\n \
                #if !defined(USE_TRANSMISSION)\n \
                    varying vec3 vWorldPosition;\n \
                #endif\n \
                uniform vec4 cutPlaneDirection;\n \
                uniform vec3 cutPlaneColor;\n \
            #endif\n \
            \n \
            void main() {\n \
                #ifdef CUT_PLANE\n \
                    if (dot(vWorldPosition, cutPlaneDirection.xyz) < -cutPlaneDirection.w) {\n \
                        discard;\n \
                    }\n \
                #endif\n \
            '
        )

        shader = shader.replace(
            '#include <normal_fragment_maps>',
            '#include <normal_fragment_maps>\n \
            \n \
            #ifdef CUT_PLANE\n \
                // on the cut surface (back facing fragments revealed), replace normal with cut plane direction\n \
                if (!gl_FrontFacing) {\n \
                    normal = -cutPlaneDirection.xyz;\n \
                }\n \
            #endif'
        )

        shader = shader.replace(
            '#include <opaque_fragment>',
            '#ifdef CUT_PLANE\n \
            if (!gl_FrontFacing) {\n \
                outgoingLight = cutPlaneColor.rgb;\n \
            }\n \
            #endif\n \
            \n \
            #include <opaque_fragment>\n \
            \n \
            #ifdef USE_ZONEMAP\n \
                vec4 zoneColor = texture2D(zoneMap, vZoneUv);\n \
            \n \
                #ifdef OVERLAY_ALPHA\n \
                    gl_FragColor += mix(vec4(0.0, 0.0, 0.0, 1.0), vec4(zoneColor.rgb, 1.0), zoneColor.a);\n \
                #endif\n \
                #ifndef OVERLAY_ALPHA\n \
                    gl_FragColor = mix(gl_FragColor, vec4(zoneColor.rgb, 1.0), zoneColor.a);\n \
                #endif\n \
            #endif'
        )

        shader = shader.replace(
            '#include <aomap_fragment>',
            '#ifdef USE_AOMAP\n \
                // if cut plane is enabled, disable ambient occlusion on back facing fragments\n \
                #ifdef CUT_PLANE\n \
                    if (gl_FrontFacing) {\n \
                #endif\n \
                \n \
                // reads channel R, compatible with a combined OcclusionRoughnessMetallic (RGB) texture\n \
                vec3 aoSample = vec3(texture2D(aoMap, vAoMapUv).r,texture2D(aoMap, vAoMapUv).r,texture2D(aoMap, vAoMapUv).r);\n \
                vec3 aoFactors = mix(vec3(1.0), aoSample, clamp(aoMapMix * aoMapIntensity, 0.0, 1.0));\n \
                float ambientOcclusion = aoFactors.x * aoFactors.y * aoFactors.z;\n \
                float ambientOcclusion2 = ambientOcclusion * ambientOcclusion;\n \
                reflectedLight.directDiffuse *= ambientOcclusion2;\n \
                reflectedLight.directSpecular *= ambientOcclusion;\n \
                //reflectedLight.indirectDiffuse *= ambientOcclusion;\n \
                \n \
                #if defined( USE_CLEARCOAT )\n \
                    clearcoatSpecularIndirect *= ambientOcclusion;\n \
                #endif\n \
                \n \
                #if defined( USE_SHEEN )\n \
                    sheenSpecularIndirect *= ambientOcclusion;\n \
                #endif\n \
                \n \
                #if defined( USE_ENVMAP ) && defined( STANDARD )\n \
                \n \
                    float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );\n \
                \n \
                    reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );\n \
                \n \
                #endif\n \
                \n \
                #ifdef CUT_PLANE\n \
                    }\n \
                #endif\n \
            #endif'
        )

        return shader;
    }
}