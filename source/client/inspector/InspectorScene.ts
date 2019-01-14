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

//import "three/examples/js/loaders/OBJLoader2";
//import "three/examples/js/loaders/FBXLoader";
import "three/examples/js/loaders/LoaderSupport";
import "three/examples/js/loaders/OBJLoader";
import "three/examples/js/loaders/PLYLoader";
import "three/examples/js/loaders/GLTFLoader";
import "three/examples/js/loaders/DRACOLoader";

//const OBJLoader2 = (THREE as any).OBJLoader2;
//const FBXLoader = (THREE as any).FBXLoader;
const OBJLoader = (THREE as any).OBJLoader;
const PLYLoader = (THREE as any).PLYLoader;
const GLTFLoader = (THREE as any).GLTFLoader;

const DRACOLoader = (THREE as any).DRACOLoader;
DRACOLoader.setDecoderPath('/js/draco/');

import OrbitControllerScene from "./OrbitControllerScene";
import UberPBRMaterial from "../core/shaders/UberPBRMaterial";

////////////////////////////////////////////////////////////////////////////////

export interface IInspectorSceneSettings
{
    exposure: number;
    lights: number;
    environment: number;
    roughness: number;
    metalness: number;
    wireframe: boolean;
    occlusion: number[];
    objectNormals: boolean;
}

export interface IInspectorSceneInfo
{
    meshNumFaces: number;
    meshNumVertices: number;
    meshHasNormals: boolean;
    meshHasUVs: boolean;
    diffuseMapSize: number;
    occlusionMapSize: number;
    normalMapSize: number;
}

export default class InspectorScene extends OrbitControllerScene
{
    public onInfo: (info: IInspectorSceneInfo) => void;

    protected renderer: THREE.WebGLRenderer;

    protected lights: THREE.DirectionalLight[];
    protected model: THREE.Mesh;
    protected material: UberPBRMaterial;
    protected defaultGeometry: THREE.BufferGeometry;
    protected defaultTexture: THREE.Texture;

    protected geometry: THREE.Geometry | THREE.BufferGeometry;
    protected geometryEnabled: boolean;

    protected textures: { [id:string]: THREE.Texture };
    protected textureEnabled: { [id:string]: boolean };
    protected textureFlipY: boolean;

    protected settings: IInspectorSceneSettings;
    protected info: IInspectorSceneInfo;

    constructor(settings: IInspectorSceneSettings)
    {
        super();

        this.onInfo = null;

        this.renderer = null;
        this.lights = [];
        this.model = null;
        this.defaultGeometry = null;
        this.defaultTexture = null;

        this.geometry = null;
        this.geometryEnabled = true;

        this.textures = {};
        this.textureEnabled = {
            diffuse: true, occlusion: true, normal: true
        };
        this.textureFlipY = true;

        this.settings = settings;

        this.info = {
            meshNumFaces: 0,
            meshNumVertices: 0,
            meshHasNormals: false,
            meshHasUVs: false,
            diffuseMapSize: 0,
            occlusionMapSize: 0,
            normalMapSize: 0
        };
    }

    setSettings(settings: IInspectorSceneSettings)
    {
        const material = this.material;
        if (material) {
            this.renderer.toneMappingExposure = Math.pow(settings.exposure, 4.0);
            material.envMapIntensity = settings.environment;

            for (let light of this.lights) {
                light.intensity = settings.lights;
            }

            material.roughness = settings.roughness;
            material.metalness = settings.metalness;
            material.aoMapMix.fromArray(settings.occlusion);
            material.enableObjectSpaceNormalMap(settings.objectNormals);

            if (material.wireframe !== settings.wireframe) {
                material.wireframe = settings.wireframe;
            }
        }

        // clone properties of settings
        this.settings = Object.assign({}, settings);
    }

    setFile(file: File, slot: string)
    {
        if (slot === "mesh") {
            this.loadMeshFile(file);
        }
        else {
            this.loadTextureFile(file, slot);
        }
    }

    setEnabled(enabled: boolean, slot: string)
    {
        if (slot === "mesh") {
            this.geometryEnabled = enabled;
            this.setModelMesh(enabled && this.geometry ? this.geometry : this.defaultGeometry);
        }
        else {
            this.textureEnabled[slot] = enabled;
            const material = this.model.material as THREE.MeshStandardMaterial;
            material.needsUpdate = true;

            switch(slot) {
                case "diffuse":
                    material.map = enabled ? this.textures["diffuse"] : null; break;
                case "occlusion":
                    material.aoMap = enabled ? this.textures["occlusion"] : null; break;
                case "normal":
                    material.normalMap = enabled ? this.textures["normal"] : null; break;
            }
        }
    }

    protected setup(scene: THREE.Scene): THREE.Camera
    {
        //renderer.gammaInput = true;
        //renderer.gammaOutput = true;

        const camera = super.setup(scene, new THREE.Vector3(0.5, 0.5, 2));

        this.setupLights(scene);
        this.setupModel(scene);

        new PLYLoader().load("models/shaderball.ply", geometry => {
            this.defaultGeometry = geometry;
            this.setModelMesh(geometry);
        });

        new THREE.TextureLoader().load("models/shaderball-2k-occlusion.jpg", texture => {
            this.defaultTexture = texture;
            this.setTexture(texture, "occlusion");
        });

        return camera;
    }

    protected setupLights(scene: THREE.Scene)
    {
        let light: THREE.DirectionalLight;

        // Light 1: warm, front right up
        light = this.lights[0] = new THREE.DirectionalLight(0xffeedd, 1.0);
        light.position.set(2, 1.3, 2.5);
        scene.add(light);

        // Light 2: blueish, below, front left
        light = this.lights[1] = new THREE.DirectionalLight(0x283d4c, 1.0);
        light.position.set(-1.5, -2, 0.5);
        scene.add(light);

        // Light 3: warm, back left
        light = this.lights[2] = new THREE.DirectionalLight(0xffeedd, 1.0);
        light.position.set(-2.5, 2, -2);
        scene.add(light);

        // Light 4: blueish, below, back right
        light = this.lights[3] = new THREE.DirectionalLight(0x365166, 1.0);
        light.position.set(1.5, -2, -0.5);
        scene.add(light);
    }

    protected setupModel(scene: THREE.Scene)
    {
        const params: THREE.MeshStandardMaterialParameters = {
            color: "#ffffff",
            roughness: 0.4,
            metalness: 0.4,
            envMapIntensity: 1.0
        };

        const geometry = new THREE.PlaneBufferGeometry(1e-10, 1e-10);
        const material: any = this.material = new UberPBRMaterial(params);
        //const material: any = this.material = new THREE.MeshPhysicalMaterial(params);

        // initialize material settings
        this.setSettings(this.settings);

        const model = this.model = new THREE.Mesh(geometry, material);
        scene.add(model);

        // load environment map
        new THREE.TextureLoader().load("models/sunset-at-pier-4k.jpg", environment => {
            environment.mapping = THREE.EquirectangularReflectionMapping;
            material.envMap = environment;
            material.needsUpdate = true;
        });
    }

    protected loadMeshFile(file: File)
    {
        if (!file) {
            this.geometry = null;
            this.setModelMesh(this.defaultGeometry);
            return;
        }

        const extension = file.name.split(".").pop().toLowerCase();
        const url = URL.createObjectURL(file);

        if (extension === "obj") {
            const loader = new OBJLoader(this.loadingManager);
            loader.load(url, obj => {
                this.geometry = (obj.children[0] as THREE.Mesh).geometry;
                this.textureFlipY = true;
                this.setModelMesh(this.geometry);
            });

            // const loader = new OBJLoader2(this.loadingManager);
            // loader.setUseIndices(true);
            // loader.setDisregardNormals(true);
            // loader.load(url, obj => {
            //     console.log(obj);
            //     this.geometry = (obj.detail.loaderRootNode.children[0] as THREE.Mesh).geometry;
            //     this.setModelMesh(this.geometry);
            // });
        }
        else if (extension === "ply") {
            const loader = new PLYLoader(this.loadingManager);
            loader.load(url, geometry => {
                this.geometry = geometry;
                this.textureFlipY = true;
                this.setModelMesh(geometry);
            });
        }
        else if (extension === "glb") {
            const loader = new GLTFLoader(this.loadingManager);
            loader.setDRACOLoader(new DRACOLoader());
            loader.load(url, gltf => {
                console.log(gltf);
                const mesh = gltf.scene.children[0];
                if (!mesh) {
                    console.error("first child of scene is not a mesh");
                    return;
                }

                const material = mesh.material;
                if (material.aoMap) {
                    this.setTexture(material.aoMap, "occlusion");
                }
                if (material.normalMap) {
                    this.setTexture(material.normalMap, "normal");
                }
                if (material.map) {
                    this.setTexture(material.map, "diffuse");
                }

                this.geometry = mesh.geometry;
                this.textureFlipY = false;
                this.setModelMesh(this.geometry);
            });
        }
    }

    protected setModelMesh(geometry: THREE.Geometry | THREE.BufferGeometry)
    {
        geometry.computeBoundingBox();
        const bb = geometry.boundingBox;

        const size = new THREE.Vector3();
        bb.getSize(size);
        const scale = 1.5 / Math.max(size.x, size.y, size.z);
        const center = new THREE.Vector3();
        bb.getCenter(center);
        center.multiplyScalar(-scale);

        this.model.position.set(center.x, center.y, center.z);
        this.model.scale.setScalar(scale);
        this.model.geometry = geometry;

        if (geometry.type === "Geometry") {
            const standardGeometry = geometry as THREE.Geometry;
            this.info.meshNumVertices = standardGeometry.vertices.length;
            this.info.meshNumFaces = standardGeometry.faces.length;
            this.info.meshHasNormals = standardGeometry.faces[0].vertexNormals.length > 0;
            this.info.meshHasUVs = standardGeometry.faceVertexUvs.length > 0;
        }
        else if (geometry.type === "BufferGeometry") {
            const bufferGeometry = geometry as THREE.BufferGeometry;
            const attributes = bufferGeometry.attributes as any;
            this.info.meshNumVertices = attributes.position.count;
            this.info.meshNumFaces = Math.trunc((bufferGeometry.index ? bufferGeometry.index.count : this.info.meshNumVertices) / 3);
            this.info.meshHasNormals = !!attributes.normal;
            this.info.meshHasUVs = !!attributes.uv;
        }

        this.setTextureFlipY();

        if (geometry === this.defaultGeometry && !this.textures["occlusion"]) {
            this.setTexture(this.defaultTexture, "occlusion")
        }
        else if (this.textures["occlusion"] === this.defaultTexture && geometry !== this.defaultGeometry) {
            this.setTexture(null, "occlusion");
        }
        else if (this.onInfo) {
            this.onInfo(this.info);
        }
    }

    protected loadTextureFile(file: File, slot: string)
    {
        if (file) {
            const url = URL.createObjectURL(file);
            new THREE.TextureLoader().load(url, texture => {
                this.setTexture(texture, slot);
            });
        }
        else {
            this.setTexture(null, slot);
        }
    }

    protected setTexture(texture: THREE.Texture, slot: string)
    {
        const material = this.model.material as UberPBRMaterial;
        material.needsUpdate = true;
        this.textures[slot] = texture;

        switch(slot) {
            case "diffuse":
                material.map = texture;
                this.info.diffuseMapSize = texture ? texture.image.width : 0;
                break;
            case "occlusion":
                if (!texture && this.geometry === this.defaultGeometry) {
                    this.textures[slot] = texture = this.defaultTexture;
                }

                material.aoMap = texture;
                this.info.occlusionMapSize = texture ? texture.image.width : 0;
                break;
            case "normal":
                material.normalMap = texture;
                this.info.normalMapSize = texture ? texture.image.width : 0;
                break;
        }

        this.setTextureFlipY();

        if (this.onInfo) {
            this.onInfo(this.info);
        }
    }

    protected setTextureFlipY()
    {
        const material = this.model.material as UberPBRMaterial;
        const flipY = this.textureFlipY;

        if (material.map) {
            material.map.flipY = flipY;
            material.map.needsUpdate = true;
        }
        if (material.aoMap) {
            material.aoMap.flipY = flipY;
            material.aoMap.needsUpdate = true;
        }
        if (material.normalMap) {
            material.normalMap.flipY = flipY;
            material.normalMap.needsUpdate = true;
        }
    }
}