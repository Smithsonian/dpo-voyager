/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Component, { IUpdateContext, types } from "@ff/graph/Component";
import ComponentTracker from "@ff/graph/ComponentTracker";
import Node from "@ff/graph/Node";
import CSelection from "@ff/graph/components/CSelection";

import Bracket from "@ff/three/Bracket";
import Axes from "@ff/three/Axes";

import { IPointerEvent } from "../RenderView";

import SpotLightHelper from "@ff/three/lights/SpotLightHelper";
import DirectionalLightHelper from "@ff/three/lights/DirectionalLightHelper";
import PointLightHelper from "@ff/three/lights/PointLightHelper";
import AmbientLightHelper from "@ff/three/lights/AmbientLightHelper";
import RectLightHelper from "@ff/three/lights/RectLightHelper";

import CObject3D from "./CObject3D";
import CTransform from "./CTransform";
import CScene, { ISceneAfterRenderEvent } from "./CScene";
import { Box3, Color, Object3D } from "three";
////////////////////////////////////////////////////////////////////////////////

const helpers = [
    [DirectionalLightHelper, "DirectionalLight"],
    [PointLightHelper, "PointLight"],
    [SpotLightHelper, "SpotLight"],
    [AmbientLightHelper, "HemisphereLight"],
    [AmbientLightHelper, "AmbientLight"],
    [RectLightHelper, "RectAreaLight"],
] as const;

const _inputs = {
    viewportPicking: types.Boolean("Viewport.Picking", true),
    viewportBrackets: types.Boolean("Viewport.Brackets", true),
};

type HelperClass = Object3D & {dispose: ()=>void, update: ()=>void};

export default class CPickSelection extends CSelection
{
    static readonly typeName: string = "CPickSelection";

    ins = this.addInputs<CSelection, typeof _inputs>(_inputs);

    private _brackets_map = new Map<Component, HelperClass>();
    private _axes_map = new Map<Component, HelperClass>();

    create()
    {
        super.create();

        this.system.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
    }

    dispose()
    {

        this.system.off<IPointerEvent>("pointer-up", this.onPointerUp, this);

        super.dispose();
    }

    update()
    {
        if(this.ins.viewportBrackets.changed){
            for(let bracket of this._brackets_map.values()){
                bracket.visible = this.ins.viewportBrackets.value;
            }
        }
        return true;
    }

    protected onSelectNode(node: Node, selected: boolean)
    {
        super.onSelectNode(node, selected);

        const transform = node.typeName === "NVScene" ? node.getComponent(CTransform, true) : node.getComponent(CObject3D, true);
        if (transform) {
            this.updateBracket(transform, selected);
        }
    }

    protected onSelectComponent(component: Component, selected: boolean)
    {
        super.onSelectComponent(component, selected);

        if (component instanceof CObject3D || component instanceof CTransform) {
            this.updateBracket(component, selected);    
        }
    }

    protected onPointerUp(event: IPointerEvent)
    {
        if (!this.ins.viewportPicking.value || !event.isPrimary || event.isDragging) {
            return;
        }

        if (event.component) {
            this.selectComponent(event.component, event.ctrlKey);
        }
        else if (!event.ctrlKey) {
            this.clearSelection();
        }
    }
    tick(ctx:IUpdateContext) :boolean{
        for(let b of this._brackets_map.values()){
            b.update();
        }
        return false;
    }

    protected updateBracket(component: CTransform | CObject3D, selected: boolean)
    {
        if (!component) {
            return;
        }
        if(!this.ins.viewportBrackets.value) return; //Don't create brackets to be hidden
        const object3D = component.object3D;
        const transform = component.transform;
        if (selected) {
            if (object3D) {
                let bracket :HelperClass;
                if((object3D as any).isLight){
                    
                    let HelperCl = helpers.find(([h,type])=>type === object3D.type)?.[0];
                    if(HelperCl){
                        object3D.updateMatrix();
                        bracket = new HelperCl(object3D as any);
                        /** @bug PointLightHelper doesn't call it internally in  its update() method. */ 
                        bracket.updateWorldMatrix( true, false );
                    }
                }

                if(!bracket){
                    bracket = new Bracket(object3D);
                }
                object3D.add(bracket);
                this._brackets_map.set(component, bracket);
            }
            
            if(transform && transform.object3D != object3D){
                let o = new Axes(transform.object3D);
                this._axes_map.set(transform, o);
                transform.object3D.add(o);
            }
        }
        else {
            if(object3D){
                const bracket = this._brackets_map.get(component);
                if (bracket) {
                    this._brackets_map.delete(component);
                    bracket.removeFromParent();
                    bracket.dispose();
                }
            }
            if(transform){
                const axes = this._axes_map.get(transform);
                if (axes) {
                    this._axes_map.delete(transform);
                    axes.removeFromParent();
                    axes.dispose();
                }
            }
        }

        this.changed = true;
    }
}
