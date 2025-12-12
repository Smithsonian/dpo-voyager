/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Vector3, Euler, Quaternion, EulerOrder, Matrix4 } from "three";

import { Node, types } from "@ff/graph/Component";

import UniversalCamera, { EProjection } from "@ff/three/UniversalCamera";
import CObject3D, { ERotationOrder } from "./CObject3D";
import math from "@ff/core/math";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _euler = new Euler();
const _quat = new Quaternion();

export { EProjection };


export default class CCamera extends CObject3D
{
    static readonly typeName: string = "CCamera";

    protected static readonly camIns = {
        autoActivate: types.Boolean("Camera.AutoActivate", true),
        activate: types.Event("Camera.Activate"),
        position: types.Vector3("Transform.Position"),
        rotation: types.Vector3("Transform.Rotation"),
        order: types.Enum("Transform.Order", ERotationOrder, ERotationOrder.ZYX),
        projection: types.Enum("Projection.Type", EProjection, EProjection.Perspective),
        fov: types.Number("Projection.FovY", 52),
        size: types.Number("Projection.Size", 20),
        zoom: types.Number("Projection.Zoom", 1),
        near: types.Number("Frustum.ZNear", 0.01),
        far: types.Number("Frustum.ZFar", 10000),
    };

    ins = this.addInputs<CObject3D, typeof CCamera.camIns>(CCamera.camIns);

    constructor(node: Node, id: string)
    {
        super(node, id);
        this.object3D = new UniversalCamera();
    }

    /**
     * Returns the internal [[UniversalCamera]] camera object of this component.
     */
    get camera() {
        return this.object3D as UniversalCamera;
    }

    update()
    {
        const { autoActivate, activate } = this.ins;

        // set the camera as active in the containing scene
        if (activate.changed || autoActivate.changed && autoActivate.value) {
            const scene = this.scene;
            if (scene) {
                scene.activeCameraComponent = this;
            }
        }

        const camera = this.camera;
        const { position, rotation, projection, fov, size, zoom, near, far } = this.ins;

        if (position.changed || rotation.changed) {
            camera.position.fromArray(position.value);
            const rot: [number, number, number, EulerOrder?] = [rotation.value[0], rotation.value[1], rotation.value[2]];
            camera.rotation.fromArray(rot);
            camera.updateMatrix();
        }

        if (projection.changed) {
            camera.setProjection(projection.getValidatedValue());
        }

        camera.fov = fov.value;
        camera.size = size.value;
        camera.zoom = zoom.value;
        camera.near = near.value;
        camera.far = far.value;

        camera.updateProjectionMatrix();
        return true;
    }

    dispose()
    {
        const scene = this.scene;
        if (scene && scene.activeCameraComponent === this) {
            scene.activeCameraComponent = null;
        }

        super.dispose();
    }

    /**
     * Sets the position, rotation, and order properties from the given 4x4 transform matrix.
     * Updating the properties then also updates the matrix of the internal universal camera object.
     * @param matrix A 4x4 transform matrix. If omitted, properties are updated from the matrix of the internal camera.
     */
    setPropertiesFromMatrix(matrix?: Matrix4)
    {
        const silent = !matrix;
        matrix = matrix || this.object3D.matrix;

        const { position, rotation, order } = this.ins;

        matrix.decompose(_vec3a, _quat, _vec3b);
        _vec3a.toArray(position.value);

        const orderName = order.getOptionText() as EulerOrder;
        _euler.setFromQuaternion(_quat, orderName);
        _vec3a.setFromEuler(_euler);
        _vec3a.multiplyScalar(math.RAD2DEG).toArray(rotation.value);

        position.set(silent);
        rotation.set(silent);
    }
}