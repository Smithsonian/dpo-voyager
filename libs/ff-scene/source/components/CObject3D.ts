/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Object3D, Vector3, MathUtils } from "three";

import { TypeOf } from "@ff/core/types";
import { ITypedEvent } from "@ff/core/Publisher";
import Component, { Node, types, IComponentEvent } from "@ff/graph/Component";
import GPUPicker from "@ff/three/GPUPicker";

import { IPointerEvent, ITriggerEvent } from "../RenderView";

import CScene, { IRenderContext } from "./CScene";
import CTransform, { ERotationOrder } from "./CTransform";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new Vector3();

export { Node, types, IPointerEvent, ITriggerEvent, IRenderContext, ERotationOrder };

export interface ICObject3D extends Component
{
    object3D: Object3D;
}

export interface IObject3DObjectEvent extends ITypedEvent<"object">
{
    current: Object3D;
    next: Object3D;
}

/**
 * Base class for drawable components. Wraps a Object3D based instance.
 * If component is added to a node together with a [[Transform]] component,
 * it is automatically added as a child to the transform.
 */
export default class CObject3D extends Component implements ICObject3D
{
    static readonly typeName: string = "CObject3D";

    /** The component type whose object3D is the parent of this component's object3D. */
    protected static readonly parentComponentClass: TypeOf<ICObject3D> = CTransform;

    static readonly object3DIns = {
        visible: types.Boolean("Object.Visible", true),
        pickable: types.Boolean("Object.Pickable"),
    };

    static readonly object3DOuts = {
        pointerDown: types.Event("Pointer.Down"),
        pointerUp: types.Event("Pointer.Up"),
        pointerActive: types.Boolean("Pointer.Active")
    };

    static readonly transformIns = CTransform.transformIns;

    ins = this.addInputs(CObject3D.object3DIns);
    outs = this.addOutputs(CObject3D.object3DOuts);


    private _object3D: Object3D = null;
    private _isPickable = false;

    constructor(node: Node, id: string)
    {
        super(node, id);
        this.addEvent("object");

        this.node.components.on(this.parentComponentClass, this._onParent, this);
    }

    /** The class of a component in the same node this component uses as parent transform. */
    get parentComponentClass(): TypeOf<ICObject3D> {
        return (this.constructor as any).parentComponentClass;
    }
    /** The transform parent of this object. */
    get parentComponent(): ICObject3D | undefined {
        return this.node.components.get(this.parentComponentClass, true);
    }
    /** The component node's transform component. */
    get transform(): CTransform | undefined {
        return this.node.components.get(CTransform, true);
    }
    /** The scene this renderable object is part of. */
    get scene(): CScene | undefined {
        const transform = this.transform;
        return transform ? transform.getParentComponent(CScene, true) : undefined;
    }
    /** The underlying [[Object3D]] of this component. */
    get object3D(): Object3D | null {
        return this._object3D;
    }

    /**
     * Assigns a [[Object3D]] to this component. The object automatically becomes a child
     * of the parent component's object.
     * @param object
     */
    set object3D(object: Object3D)
    {
        const currentObject = this._object3D;
        if (currentObject) {
            currentObject.userData["component"] = null;

            this.unregisterPickableObject3D(currentObject, true);

            if (currentObject.parent) {
                this.onRemoveFromParent(currentObject.parent);
            }
        }

        this.emit<IObject3DObjectEvent>({ type: "object", current: currentObject, next: object });
        this._object3D = object;

        if (object) {
            object.userData["component"] = this;
            object.matrixAutoUpdate = false;
            object.visible = this.ins.visible.value;

            this.registerPickableObject3D(object, true);

            const parentComponent = this.parentComponent;
            if (parentComponent) {
                this.onAddToParent(parentComponent.object3D);
            }
        }
    }

    update(context): boolean
    {
        const { visible, pickable } = this.ins;

        if (visible.changed && this._object3D) {
            this._object3D.visible = visible.value;
        }
        if (pickable.changed && pickable.value !== this._isPickable) {
            this._isPickable = pickable.value;

            if (pickable.value) {
                this.enablePointerEvents();
            }
            else {
                this.disablePointerEvents();
            }
        }

        return true;
    }

    dispose()
    {
        this.object3D = null;

        if (this.ins.pickable.value) {
            this.disablePointerEvents();
        }

        this.node.components.off(this.parentComponentClass, this._onParent, this);
        super.dispose();
    }

    /**
     * This is called right before the graph's scene is rendered to a specific viewport/view.
     * Override to make adjustments specific to the renderer, view or viewport.
     * @param context
     */
    preRender(context: IRenderContext)
    {
    }

    /**
     * This is called right after the graph's scene has been rendered to a specific viewport/view.
     * Override to make adjustments specific to the renderer, view or viewport.
     * @param context
     */
    postRender(context: IRenderContext)
    {
    }

    /**
     * Returns a text representation.
     */
    toString()
    {
        return super.toString() + (this._object3D ? ` - type: ${this._object3D.type}` : " - (null)");
    }

    protected onPointer(event: IPointerEvent)
    {
        const outs = this.outs;

        if (event.type === "pointer-down") {
            outs.pointerDown.set();
            outs.pointerActive.setValue(true);
        }
        else if (event.type === "pointer-up") {
            outs.pointerUp.set();
            outs.pointerActive.setValue(false);
        }

        event.stopPropagation = true;
    }

    protected enablePointerEvents()
    {
        this.on<IPointerEvent>("pointer-down", this.onPointer, this);
        this.on<IPointerEvent>("pointer-up", this.onPointer, this);
    }

    protected disablePointerEvents()
    {
        this.off<IPointerEvent>("pointer-down", this.onPointer, this);
        this.off<IPointerEvent>("pointer-up", this.onPointer, this);

        const outs = this.outs;

        if (outs.pointerActive.value) {
            outs.pointerUp.set();
            outs.pointerActive.setValue(false);
        }
    }

    protected updateTransform()
    {
        const object3D = this._object3D;
        if (!object3D) {
            return;
        }

        const { position, rotation, order, scale } = this.ins as any;

        if (position.changed || rotation.changed || order.changed || scale.changed) {

            // update position
            object3D.position.fromArray(position.value);

            // update rotation angles, rotation order
            _vec3.fromArray(rotation.value).multiplyScalar(MathUtils.DEG2RAD);
            const orderName = order.getOptionText();
            object3D.rotation.setFromVector3(_vec3, orderName);

            // update scale
            object3D.scale.fromArray(scale.value);

            // compose matrix
            object3D.updateMatrix();
        }

        return true;
    }

    protected onAddToParent(parent: Object3D)
    {
        parent.add(this._object3D);
    }

    protected onRemoveFromParent(parent: Object3D)
    {
        parent.remove(this._object3D);
    }

    /**
     * Adds a [[Object3D]] as a child to this component's object.
     * Registers the object with the picking service to make it pickable.
     * @param object
     */
    protected addObject3D(object: Object3D)
    {
        this._object3D.add(object);
        this.registerPickableObject3D(object, true);
    }

    /**
     * Removes a [[Object3D]] child from this component's object.
     * Also unregisters the object from the picking service.
     * @param object
     */
    protected removeObject3D(object: Object3D)
    {
        this.unregisterPickableObject3D(object, true);
        this._object3D.remove(object);
    }

    /**
     * This should be called after an external change to this component's Object3D subtree.
     * It registers newly added mesh objects with the picking service.
     * @param object
     * @param recursive
     */
    protected registerPickableObject3D(object: Object3D, recursive: boolean)
    {
        GPUPicker.add(object, recursive);
    }

    /**
     * This should be called before an external change to this component's Object3D subtree.
     * It unregisters the mesh objects in the subtree from the picking service.
     * @param object
     * @param recursive
     */
    protected unregisterPickableObject3D(object: Object3D, recursive: boolean)
    {
        GPUPicker.remove(object, recursive);
    }

    private _onParent(event: IComponentEvent<ICObject3D>)
    {
        // add this Object3D to the parent Object3D
        if (this._object3D && !this._object3D.parent && event.add) {
            this.onAddToParent(event.object.object3D);
        }
    }
}

CObject3D.prototype.preRender = null;
CObject3D.prototype.postRender = null;
