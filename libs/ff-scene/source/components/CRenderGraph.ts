/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Object3D } from "three";

import CGraph, { Node, types } from "@ff/graph/components/CGraph";
import CHierarchy from "@ff/graph/components/CHierarchy";
import { ICObject3D } from "./CObject3D";

import CTransform from "./CTransform";
import CScene from "./CScene";

////////////////////////////////////////////////////////////////////////////////

export { Node, types };

export default class CRenderGraph extends CGraph implements ICObject3D
{
    static readonly typeName: string = "CRenderGraph";

    protected static readonly rgIns = {
        visible: types.Boolean("Graph.Visible", true),
    };

    ins = this.addInputs<CGraph, typeof CRenderGraph.rgIns>(CRenderGraph.rgIns);

    private _object3D: Object3D = null;
    private _isAttached = false;

    constructor(node: Node, id: string)
    {
        super(node, id);

        this._object3D = new Object3D();
        this._object3D.matrixAutoUpdate = false;
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

    create()
    {
        super.create();

        // add existing inner root transforms
        this.innerRoots
            .filter(root => root.is(CTransform))
            .forEach((root: CTransform) => this._object3D.add(root.object3D));

        // track transform component
        this.trackComponent(CTransform,
            component => this.ins.visible.value && this.attachObject3D(component),
            component => this.detachObject3D(component)
        );
    }

    dispose()
    {
        this.detachObject3D(this.transform);

        // remove all inner root transforms
        this.innerRoots
            .filter(root => root.is(CTransform))
            .forEach((root: CTransform) => this._object3D.remove(root.object3D));

        super.dispose();
    }

    update(context)
    {
        super.update(context);

        const ins = this.ins;

        if (ins.visible.changed) {
            const parent = this.transform;
            if (ins.visible.value) {
                this.attachObject3D(parent);
            }
            else {
                this.detachObject3D(parent);
            }
        }

        return true;
    }

    onAddInnerRoot(component: CHierarchy)
    {
        if (component.is(CTransform)) {
            this._object3D.add((component as CTransform).object3D);
        }
    }

    onRemoveInnerRoot(component: CHierarchy)
    {
        if (component.is(CTransform)) {
            this._object3D.remove((component as CTransform).object3D);
        }
    }

    protected attachObject3D(parent: CTransform)
    {
        if (this._isAttached) {
            return;
        }

        if (parent) {
            parent.object3D.add(this._object3D);
            this._isAttached = true;
        }
    }

    protected detachObject3D(parent: CTransform)
    {
        if (!this._isAttached) {
            return;
        }

        if (parent) {
            parent.object3D.remove(this._object3D);
            this._isAttached = false;
        }
    }
}