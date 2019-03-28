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


import CVAssetReader from "../../components/CVAssetReader";
import CVScene from "../../components/CVScene";

import SystemView, { customElement, html } from "@ff/scene/ui/SystemView";
import SceneView from "../SceneView";
import "../Spinner";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-content-view")
export default class ContentView extends SystemView
{
    protected sceneView: SceneView = null;

    protected get assetReader() {
        return this.system.getMainComponent(CVAssetReader);
    }

    protected firstConnected()
    {
        this.classList.add("sv-content-view");
        this.sceneView = new SceneView(this.system);
    }

    protected connected()
    {
        this.assetReader.outs.busy.on("value", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.assetReader.outs.busy.off("value", this.performUpdate, this);
    }

    protected render()
    {
        const isLoading = this.assetReader.outs.busy.value;

        // if (!isLoading) {
        //     const scene = this.system.getComponent(CVScene, true);
        //     if (scene) {
        //         scene.ins.zoomExtents.set();
        //     }
        // }

        return html`${this.sceneView}
            <sv-spinner ?visible=${isLoading}></sv-spinner>`;
    }
}
