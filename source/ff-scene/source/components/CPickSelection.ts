/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Component, { types } from "@ff/graph/Component";
import ComponentTracker from "@ff/graph/ComponentTracker";
import Node from "@ff/graph/Node";
import CSelection from "@ff/graph/components/CSelection";

import Bracket from "@ff/three/Bracket";

import { IPointerEvent } from "../RenderView";

import CObject3D from "./CObject3D";
import CTransform from "./CTransform";
import CScene, { ISceneAfterRenderEvent } from "./CScene";
import { DirectionalLight, DirectionalLightHelper, HemisphereLight, HemisphereLightHelper, Object3D, PointLight, PointLightHelper, RectAreaLight, SpotLight, SpotLightHelper } from "three";

////////////////////////////////////////////////////////////////////////////////

const helpers = [
    [DirectionalLightHelper, DirectionalLight],
    [PointLightHelper, PointLight],
    [SpotLightHelper, SpotLight],
    [HemisphereLightHelper, HemisphereLight],
    [PointLightHelper, RectAreaLight],
] as const;

const _inputs = {
    viewportPicking: types.Boolean("Viewport.Picking", true),
    viewportBrackets: types.Boolean("Viewport.Brackets", true),
};

export default class CPickSelection extends CSelection
{
    static readonly typeName: string = "CPickSelection";

    ins = this.addInputs<CSelection, typeof _inputs>(_inputs);

    private _brackets = new Map<Component, any>();
    private _sceneTracker: ComponentTracker<CScene> = null;


    create()
    {
        super.create();

        this.system.on<IPointerEvent>("pointer-up", this.onPointerUp, this);

        this._sceneTracker = new ComponentTracker(this.system.components, CScene, component => {
            component.on<ISceneAfterRenderEvent>("after-render", this.onSceneAfterRender, this);
        }, component => {
            component.off<ISceneAfterRenderEvent>("after-render", this.onSceneAfterRender, this);
        });
    }

    dispose()
    {
        this._sceneTracker.dispose();

        this.system.off<IPointerEvent>("pointer-up", this.onPointerUp, this);
        this._sceneTracker.dispose();

        super.dispose();
    }

    update()
    {
        return true;
    }

    protected onSelectNode(node: Node, selected: boolean)
    {
        super.onSelectNode(node, selected);

        const transform = node.getComponent(CTransform, true);
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

    // protected onActiveGraph(graph: Graph)
    // {
    //     if (this._sceneTracker) {
    //         this._sceneTracker.dispose();
    //     }
    //
    //     if (graph) {
    //         this._sceneTracker = new ComponentTracker(graph.components, CScene, component => {
    //             component.on<ISceneAfterRenderEvent>("after-render", this.onSceneAfterRender, this);
    //         }, component => {
    //             component.off<ISceneAfterRenderEvent>("after-render", this.onSceneAfterRender, this);
    //         });
    //     }
    // }

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

    protected onSceneAfterRender(event: ISceneAfterRenderEvent)
    {
        if (!this.ins.viewportBrackets.value) {
            return;
        }

        const renderer = event.context.renderer;
        const camera = event.context.camera;

        for (let bracket of this._brackets.values()) {
            if(helpers.some(([HelperCl])=> bracket instanceof HelperCl)){
                bracket.update();
                /** @bug PointLightHelper doesn't call it internally in  its update() method. */ 
                bracket.updateWorldMatrix( true, false );
            }
            renderer.render(bracket as any, camera);
        }
    }

    protected updateBracket(component: CTransform | CObject3D, selected: boolean)
    {
        if (!component) {
            return;
        }

        if (selected) {
            const object3D = component.object3D;
            if (object3D) {
                let bracket;
                for(let [HelperCl, Cl] of helpers){
                    if(object3D.children[0] instanceof Cl){
                        bracket = new HelperCl(object3D.children[0] as any, 1.0);
                        /** @bug PointLightHelper doesn't call it internally in  its update() method. */ 
                        bracket.updateWorldMatrix( true, false );
                    }
                }
                if(!bracket){
                    bracket = new Bracket(component.object3D);

                }
                this._brackets.set(component, bracket);
            }
        }
        else {
            const bracket = this._brackets.get(component);
            if (bracket) {
                this._brackets.delete(component);
                bracket.dispose();
            }
        }

        this.changed = true;
    }
}
