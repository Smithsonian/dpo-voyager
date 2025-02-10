/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
    Object3D,
    Mesh,
    Texture,
    Material,
    BufferGeometry,
    Vector3,
    Matrix4,
    Box3,
    Euler,
    Quaternion,
    MathUtils,
    EulerOrder,
} from "three";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new Vector3();
const _mat4 = new Matrix4();
const _euler = new Euler();
const _quat = new Quaternion();

export type RotationOrder = "XYZ" | "XZY" | "YXZ" | "YZX" | "ZXY" | "ZYX";

export function degreesToQuaternion(rotation: number[], order: RotationOrder, quaternion?: Quaternion): Quaternion
{
    const result = quaternion || new Quaternion();

    _vec3.fromArray(rotation).multiplyScalar(MathUtils.DEG2RAD);
    _euler.setFromVector3(_vec3, order);
    result.setFromEuler(_euler);

    return result;
}

export function quaternionToDegrees(quaternion: Quaternion, order: string, rotation?: number[]): number[]
{
    const result = rotation || [ 0, 0, 0 ];

    _euler.setFromQuaternion(quaternion, order as EulerOrder);
    _vec3.setFromEuler(_euler);
    _vec3.multiplyScalar(MathUtils.RAD2DEG).toArray(result);

    return result;
}

export function disposeObject(object: Object3D)
{
    const geometries = new Map<string, BufferGeometry>();
    const materials = new Map<string, Material>();
    const textures = new Map<string, Texture>();

    object.traverse(object => {
        const mesh = object as Mesh;
        if (mesh.isMesh) {
            const geometry = mesh.geometry as BufferGeometry;
            if (geometry) {
                geometries.set(geometry.uuid, geometry);
            }
            const material = mesh.material as Material;
            if (material) {
                materials.set(material.uuid, material);
                for (let key in material) {
                    const texture = material[key] as any; // Texture;
                    if (texture && texture.isTexture) {
                        textures.set(texture.uuid, texture);
                    }
                }

            }
        }
    });

    if (ENV_DEVELOPMENT) {
        console.log("disposeObject - %s geometries, %s materials, %s textures",
            geometries.size, materials.size, textures.size);
    }

    for (let entry of textures) {
        entry[1].dispose();
    }
    for (let entry of materials) {
        entry[1].dispose();
    }
    for (let entry of geometries) {
        entry[1].dispose();
    }
}

/**
 * Computes the bounding box of the given object, relative to the given root (same as object if
 * not specified explicitly). Accounts for the transforms of all children relative to the root.
 * Caller is responsible for emptying the given bounding box, and for updating the matrices of
 * all child objects.
 * @param object
 * @param box The box to be updated.
 * @param root
 */
export function computeLocalBoundingBox(object: Object3D, box: Box3, root?: Object3D)
{
    if (!root) {
        root = object;
    }

    // Don't include branches under invisible objects or masked objects
    if(!object.visible || object.layers.mask > 1) {
        return;
    }

    const geometry = (object as any).geometry;
    if (geometry && object.visible) {

        let current = object;
        _mat4.identity();

        while(current && current !== root) {
            _mat4.premultiply(current.matrix);
            current = current.parent;
        }

        if (geometry.isGeometry) {
            const vertices = geometry.vertices;
            for (let i = 0, n = vertices.length; i < n; ++i) {
                _vec3.copy(vertices[i]).applyMatrix4(_mat4);
                box.expandByPoint(_vec3);
            }
        }
        else if (geometry.isBufferGeometry) {
            const attribute = geometry.attributes.position;
            if (attribute !== undefined) {
                for (let i = 0, n = attribute.count; i < n; ++i) {
                    _vec3.fromBufferAttribute(attribute, i).applyMatrix4(_mat4);
                    box.expandByPoint(_vec3);
                }
            }
        }
    }

    const children = object.children;
    for (let i = 0, n = children.length; i < n; ++i) {
        computeLocalBoundingBox(children[i], box, root);
    }
}