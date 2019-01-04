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

import Commander from "@ff/core/Commander";
import Registry from "@ff/graph/Registry";
import RenderSystem from "@ff/scene/RenderSystem";
import RenderQuadView from "@ff/scene/RenderQuadView";

import LoadingManager from "./loaders/LoadingManager";

////////////////////////////////////////////////////////////////////////////////

export default class VoyagerSystem extends RenderSystem
{
    readonly loadingManager: LoadingManager;

    constructor(commander: Commander, registry?: Registry)
    {
        super(registry);

        this.loadingManager = new LoadingManager();
    }

    getPrimaryView(): RenderQuadView
    {
        const views = this.views;
        for (let i = 0, n = views.length; i < n; ++i) {
            if (views[i] instanceof RenderQuadView) {
                return views[i] as RenderQuadView;
            }
        }

        return null;
    }
}