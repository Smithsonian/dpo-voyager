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


import CVAssetLoader from "../../core/components/CVAssetLoader";
import CVScene_old from "../../core/components/CVScene_old";

import SystemElement, { customElement, html } from "../../core/ui/SystemElement";

import SceneView from "../../core/ui/SceneView";
import "../../core/ui/Spinner";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-content-view")
export default class ContentView extends SystemElement
{
    protected sceneView: SceneView = null;

    protected get assetLoader() {
        return this.system.getMainComponent(CVAssetLoader);
    }

    protected firstConnected()
    {
        this.classList.add("sv-content-view");
        this.sceneView = new SceneView(this.system);
    }

    protected connected()
    {
        this.assetLoader.outs.loading.on("value", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.assetLoader.outs.loading.off("value", this.performUpdate, this);
    }

    protected render()
    {
        const isLoading = this.assetLoader.outs.loading.value;

        if (!isLoading) {
            const scene = this.system.getComponent(CVScene_old, true);
            if (scene) {
                scene.ins.zoomExtents.set();
            }
        }


        return html`${this.sceneView}
            <sv-spinner ?visible=${isLoading}></sv-spinner>`;
    }
}
