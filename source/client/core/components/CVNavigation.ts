/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Component, { types } from "@ff/graph/Component";
import { EProjection } from "@ff/three/UniversalCamera";

import { IPointerEvent, ITriggerEvent } from "@ff/scene/RenderView";
import CRenderer, { IActiveSceneEvent } from "@ff/scene/components/CRenderer";

import { INavigation } from "common/types/config";

import CVScene from "./CVScene";

////////////////////////////////////////////////////////////////////////////////

export { EProjection };
export enum EViewPreset { Left, Right, Top, Bottom, Front, Back, None }

const _inputs = {
    preset: types.Enum("Camera.ViewPreset", EViewPreset, EViewPreset.None),
    projection: types.Enum("Camera.Projection", EProjection, EProjection.Perspective),
    zoomExtent: types.Event("Camera.ZoomExtent"),
    enabled: types.Boolean("Manip.Enabled", true),
};

export default class CVNavigation extends Component
{
    ins = this.addInputs(_inputs);

    protected activeScene: CVScene = null;

    protected get renderer() {
        return this.getMainComponent(CRenderer);
    }
    protected get activeCamera() {
        return this.activeScene ? this.activeScene.activeCameraComponent : null;
    }

    create()
    {
        super.create();

        this.system.on<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        this.system.on<ITriggerEvent>("wheel", this.onTrigger, this);

        this.renderer.on<IActiveSceneEvent>("active-scene", this.onActiveScene, this);
        this.activeScene = this.renderer.activeSceneComponent as CVScene;
    }

    dispose()
    {
        this.renderer.off<IActiveSceneEvent>("active-scene", this.onActiveScene, this);

        this.system.off<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        this.system.off<ITriggerEvent>("wheel", this.onTrigger, this);

        super.dispose();
    }


    fromData(data: INavigation)
    {
        this.ins.enabled.setValue(data.enabled);
    }

    toData(): Partial<INavigation>
    {
        return {
            enabled: this.ins.enabled.value,
        };
    }

    protected onPointer(event: IPointerEvent)
    {
    }

    protected onTrigger(event: ITriggerEvent)
    {
    }

    protected onActiveScene(event: IActiveSceneEvent)
    {
        if (event.next instanceof CVScene) {
            this.activeScene = event.next;
            this.changed = true;
        }
    }
}