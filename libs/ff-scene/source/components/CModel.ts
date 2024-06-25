/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Object3D } from "three";

import { IPointerEvent } from "../RenderView";

import CRenderGraph, { types } from "./CRenderGraph";
import CAssetLoader from "./CAssetLoader";

////////////////////////////////////////////////////////////////////////////////

export default class CModel extends CRenderGraph
{
    static readonly typeName: string = "CModel";

    protected static readonly modelIns = {
        asset: types.AssetPath("Model.Asset"),
        pickable: types.Boolean("Model.Pickable"),
    };

    protected static readonly modelOuts = {
        pointerDown: types.Event("Pointer.Down"),
        pointerUp: types.Event("Pointer.Up"),
        pointerActive: types.Boolean("Pointer.Active")
    };

    ins = this.addInputs<CRenderGraph, typeof CModel.modelIns>(CModel.modelIns);
    outs = this.addOutputs<CRenderGraph, typeof CModel.modelOuts>(CModel.modelOuts);

    private _isPickable = false;

    protected get assetLoader() {
        return this.getMainComponent(CAssetLoader, true);
    }

    load(assetPath: string)
    {
        const modelLoader = this.assetLoader.getLoader("model");
        this.clearInnerGraph();

        if (assetPath && modelLoader && modelLoader.canLoad(assetPath)) {

        }
    }

    parse(object: Object3D)
    {
        this.clearInnerGraph();


    }

    update(context)
    {
        super.update(context);

        const ins = this.ins;

        if (ins.asset.changed) {
            this.load(ins.asset.value);
        }

        if (ins.pickable.changed && ins.pickable.value !== this._isPickable) {
            this._isPickable = ins.pickable.value;

            if (ins.pickable.value) {
                this.enablePointerEvents();
            }
            else {
                this.disablePointerEvents();
            }
        }

        return true;
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
}