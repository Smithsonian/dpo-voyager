/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Object3D, Vector3, Matrix4, Quaternion, Euler, EulerOrder } from "three";

import math from "@ff/core/math";

import Component, { Node, types } from "@ff/graph/Component";
import CHierarchy from "@ff/graph/components/CHierarchy";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _quat = new Quaternion();
const _euler = new Euler();

export { types };

export enum ERotationOrder { XYZ, YZX, ZXY, XZY, YXZ, ZYX }

export interface ICObject3D extends Component
{
    object3D: Object3D;
}

/**
 * Allows arranging components in a hierarchical structure. Each [[TransformComponent]]
 * contains a transformation which affects its children as well as other components which
 * are part of the same entity.
 */
export default class CTransform extends CHierarchy implements ICObject3D
{
    static readonly typeName: string = "CTransform";

    static readonly transformIns = {
        position: types.Vector3("Transform.Position"),
        rotation: types.Vector3("Transform.Rotation"),
        order: types.Enum("Transform.Order", ERotationOrder),
        scale: types.Scale3("Transform.Scale")
    };

    static readonly transformOuts = {
        matrix: types.Matrix4("Transform.Matrix")
    };

    ins = this.addInputs(CTransform.transformIns);
    outs = this.addOutputs(CTransform.transformOuts);

    private _object3D: Object3D;

    constructor(node: Node, id: string)
    {
        super(node, id);

        this._object3D = this.createObject3D();
        this._object3D.matrixAutoUpdate = false;
    }

    get transform(): CTransform {
        return this;
    }

    /**
     * Returns the three.js renderable object wrapped in this component.
     */
    get object3D(): Object3D {
        return this._object3D;
    }

    /**
     * Returns an array of child components of this.
     */
    get children(): Readonly<CTransform[]> {
        return this._children as CTransform[] || [];
    }

    /**
     * Returns a reference to the local transformation matrix.
     */
    get matrix(): Readonly<Matrix4> {
        return this._object3D.matrix;
    }

    update(context)
    {
        const object3D = this._object3D;
        const { position, rotation, order, scale } = this.ins;
        const { matrix } = this.outs;

        object3D.position.fromArray(position.value);
        _vec3a.fromArray(rotation.value).multiplyScalar(math.DEG2RAD);
        const orderName = order.getOptionText() as EulerOrder;
        object3D.rotation.setFromVector3(_vec3a, orderName);
        object3D.scale.fromArray(scale.value);
        object3D.updateMatrix();

        (object3D.matrix as any).toArray(matrix.value);
        matrix.set();

        return true;
    }

    dispose()
    {
        if (this._object3D) {
            // detach all children
            this._object3D.children.slice().forEach(child => this._object3D.remove(child));

            // detach from parent
            if (this._object3D.parent) {
                this._object3D.parent.remove(this._object3D);
            }
        }

        super.dispose();
    }

    setPropertiesFromMatrix(matrix?: Matrix4)
    {
        const silent = !matrix;
        matrix = matrix || this._object3D.matrix;

        const { position, rotation, order, scale } = this.ins;

        matrix.decompose(_vec3a, _quat, _vec3b);
        _vec3a.toArray(position.value);

        const orderName = order.getOptionText() as EulerOrder;
        _euler.setFromQuaternion(_quat, orderName);
        _vec3a.setFromEuler(_euler);
        _vec3a.multiplyScalar(math.RAD2DEG).toArray(rotation.value);

        _vec3b.toArray(scale.value);

        position.set(silent);
        rotation.set(silent);
        scale.set(silent);
    }

    /**
     * Adds the given transform component as a children to this.
     * @param component
     */
    addChild(component: CTransform)
    {
        super.addChild(component);
        this._object3D.add(component._object3D);
    }

    /**
     * Removes the given transform component from the list of children of this.
     * @param component
     */
    removeChild(component: CTransform)
    {
        this._object3D.remove(component._object3D);
        super.removeChild(component);
    }

    protected createObject3D()
    {
        return new Object3D();
    }
}
