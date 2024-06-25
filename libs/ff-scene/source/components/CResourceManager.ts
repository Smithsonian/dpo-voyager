/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

// import {
//     Mesh,
//     Texture,
//     Geometry,
//     BufferGeometry,
//     Material,
//     Object3D
// } from "three";
//
// import Component, { types } from "@ff/graph/Component";
//
// ////////////////////////////////////////////////////////////////////////////////
//
// export type Resource = Texture | Geometry | BufferGeometry | Material;
//
// export interface IResourceEntry
// {
//     refCount: number;
//     components: Map<Component, number>;
// }
//
// /**
//  * Resource manager for Three.js geometry, textures, and materials (shaders).
//  */
// export default class CResourceManager extends Component
// {
//     static readonly typeName: string = "CResourceManager";
//
//     private geometries = new Map<Geometry | BufferGeometry, Map<Component, number>>();
//     private materials = new Map<Material, Map<Component, number>>();
//     private textures = new Map<Texture, Map<Component, number>>();
//
//     useGeometry(geometry: Geometry | BufferGeometry, component: Component)
//     {
//
//     }
//
//     addResource(resource: Resource)
//     {
//         this._getOrCreateEntry(resource, { refCount: 1 });
//     }
//
//     removeResource(resource: Resource)
//     {
//         this._deleteEntry(resource);
//     }
//
//     addSubtree(object: Object3D)
//     {
//         object.traverse(object => {
//             const mesh = object as Mesh;
//             if (mesh.isMesh) {
//                 const geometry = mesh.geometry as BufferGeometry;
//                 if (geometry) {
//                     this.geometries.set(geometry, geometry);
//                 }
//                 const material = mesh.material as THREE.Material;
//                 if (material) {
//                     materials.set(material.uuid, material);
//                     for (let key in material) {
//                         const texture = material[key] as any; // THREE.Texture;
//                         if (texture && texture.isTexture) {
//                             textures.set(texture.uuid, texture);
//                         }
//                     }
//
//                 }
//             }
//         });
//     }
//
//     removeSubtree(object: Object3D)
//     {
//         this.traverseSubtree(object, texture => this)
//     }
//
//     traverseSubtree(object: Object3D,
//         onTexture: (texture: Texture) => void,
//         onGeometry: (geometry: Geometry | BufferGeometry) => void,
//         onMaterial: (material: Material) => void)
//     {
//         object.traverse(object => {
//             const mesh = object as Mesh;
//             if (mesh.isMesh) {
//                 if (mesh.geometry) {
//                     onGeometry(mesh.geometry);
//                 }
//
//                 const material = mesh.material as THREE.Material;
//                 if (material) {
//                     if (Array.isArray(material)) {
//                         material.forEach(entry => {
//                             onMaterial(material);
//                             this._visitTextures(entry, onTexture)
//                         });
//                     }
//                     else {
//                         onMaterial(material);
//                         this._visitTextures(material, onTexture);
//                     }
//                 }
//             }
//         });
//     }
//
//     private _visitTextures(material: Material, onTexture: (texture: Texture) => void)
//     {
//         const keys = Object.keys(material);
//         for (let i = 0, n = keys.length; i < n; ++i) {
//             const texture = material[keys[i]] as any; // THREE.Texture;
//             if (texture && texture.isTexture) {
//                 onTexture(texture);
//             }
//         }
//     }
//
//     private _getOrCreateEntry(resource: Resource, template?: IResourceEntry): IResourceEntry | undefined
//     {
//         let entry;
//
//         if (resource.isTexture) {
//             entry = this.textures.get(resource as Texture);
//             if (!entry) {
//                 entry = template;
//                 if (entry) {
//                     this.textures.set(resource, entry);
//                 }
//             }
//         }
//         if (resource.isGeometry || resource.isBufferGeometry) {
//             entry = this.geometries.get(resource as BufferGeometry);
//             if (!entry) {
//                 entry = template;
//                 if (entry) {
//                     this.geometries.set(resource, entry);
//                 }
//             }
//         }
//         if (resource.isMaterial) {
//             entry = this.materials.get(resource as Material);
//             if (!entry) {
//                 entry = template;
//                 if (entry) {
//                     this.materials.set(resource, entry);
//                 }
//             }
//         }
//
//         return entry;
//     }
//
//     private _deleteEntry(resource: Resource)
//     {
//         if (resource.isTexture) {
//             this.textures.delete(resource);
//         }
//         if (resource.isGeometry || resource.isBufferGeometry) {
//             this.geometries.delete(resource);
//         }
//         if (resource.isMaterial) {
//             this.materials.delete(resource);
//         }
//     }
// }