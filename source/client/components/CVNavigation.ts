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

import CObject3D, { types } from "@ff/scene/components/CObject3D";
import { IPointerEvent, ITriggerEvent } from "@ff/scene/RenderView";

import { EProjection } from "@ff/three/UniversalCamera";

import { INavigation } from "common/types/scene";

import CVAssetReader from "./CVAssetReader";

////////////////////////////////////////////////////////////////////////////////

export { EProjection };

export enum EViewPreset { Left, Right, Top, Bottom, Front, Back, None }


export default class CVNavigation extends CObject3D
{
    static readonly typeName: string = "CVNavigation";

    protected static readonly navIns = {
        enabled: types.Boolean("Navigation.Enabled", true),
        autoZoom: types.Boolean("Navigation.AutoZoom", true),
        zoomExtents: types.Event("Navigation.ZoomExtents"),
        preset: types.Enum("Camera.ViewPreset", EViewPreset, EViewPreset.None),
        projection: types.Enum("Camera.Projection", EProjection, EProjection.Perspective),
    };

    ins = this.addInputs<CObject3D, typeof CVNavigation.navIns>(CVNavigation.navIns);


    protected get assetReader() {
        return this.getMainComponent(CVAssetReader);
    }

    create()
    {
        super.create();

        this.system.on<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        this.system.on<ITriggerEvent>("wheel", this.onTrigger, this);

        this.assetReader.outs.completed.on("value", this.onLoadingCompleted, this);
    }

    dispose()
    {
        this.assetReader.outs.completed.off("value", this.onLoadingCompleted, this);

        this.system.off<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        this.system.off<ITriggerEvent>("wheel", this.onTrigger, this);

        super.dispose();
    }


    fromData(data: INavigation)
    {
        this.ins.copyValues({
            enabled: !!data.enabled,
            autoZoom: !!data.autoZoom,
        });
    }

    toData(): Partial<INavigation>
    {
        return {
            enabled: this.ins.enabled.value,
            autoZoom: this.ins.autoZoom.value,
        };
    }

    protected onPointer(event: IPointerEvent)
    {
    }

    protected onTrigger(event: ITriggerEvent)
    {
    }

    protected onLoadingCompleted(isLoading: boolean)
    {
        this.ins.zoomExtents.set();
    }
}