/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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


import CVAssetManager from "../../components/CVAssetManager";

import SystemView, { customElement, html } from "@ff/scene/ui/SystemView";
import SceneView from "../SceneView";
import "../Spinner";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-content-view")
export default class ContentView extends SystemView
{
    protected sceneView: SceneView = null;

    protected get assetManager() {
        return this.system.getMainComponent(CVAssetManager);
    }

    protected firstConnected()
    {
        this.classList.add("sv-content-view");
        this.sceneView = new SceneView(this.system);
    }

    protected connected()
    {
        this.assetManager.outs.busy.on("value", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.assetManager.outs.busy.off("value", this.performUpdate, this);
    }

    protected render()
    {
        const isLoading = this.assetManager.outs.busy.value;

        return html`${this.sceneView}
            <sv-spinner ?visible=${isLoading}></sv-spinner>`;
    }
}
