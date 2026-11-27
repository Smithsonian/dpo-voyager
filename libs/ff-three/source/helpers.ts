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
const _box3 = new Box3();
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
 * Expands the box by the bounding boxes of the object's visible geometries (layer 0),
 * transformed into the root's space (the object's if not given). Doesn't read vertices.
 * @returns False if a rotation by other than multiples of 90° made the box larger than the geometry.
 */
export function expandByGeometryBounds(object: Object3D, box: Box3, root?: Object3D): boolean
{
    if (!root) {
        root = object;
    }

    // Don't include branches under invisible objects or masked objects
    if(!object.visible || object.layers.mask > 1) {
        return true;
    }

    if (object.matrixAutoUpdate) {
        object.updateMatrix();
    }

    let tight = true;

    const geometry = (object as any).geometry as BufferGeometry;
    if (geometry && geometry.isBufferGeometry) {
        if (!geometry.boundingBox) {
            geometry.computeBoundingBox();
        }

        let current = object;
        _mat4.identity();

        while(current && current !== root) {
            _mat4.premultiply(current.matrix);
            current = current.parent;
        }

        if (!geometry.boundingBox.isEmpty()) {
            box.union(_box3.copy(geometry.boundingBox).applyMatrix4(_mat4));
            tight = isAxisAligned(_mat4);
        }
    }

    const children = object.children;
    for (let i = 0, n = children.length; i < n; ++i) {
        tight = expandByGeometryBounds(children[i], box, root) && tight;
    }

    return tight;
}

/** True if the matrix maps each axis onto an axis: it rotates by multiples of 90° only. */
export function isAxisAligned(matrix: Matrix4): boolean
{
    const e = matrix.elements;

    // each column (the image of an axis) has a single non-zero component
    for (let column = 0; column < 3; ++column) {
        const x = Math.abs(e[column * 4]), y = Math.abs(e[column * 4 + 1]), z = Math.abs(e[column * 4 + 2]);
        const epsilon = Math.max(x, y, z) * 1e-6;
        if ((x > epsilon ? 1 : 0) + (y > epsilon ? 1 : 0) + (z > epsilon ? 1 : 0) > 1) {
            return false;
        }
    }

    return true;
}