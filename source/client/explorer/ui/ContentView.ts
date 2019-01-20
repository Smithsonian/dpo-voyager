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

import ManipTarget from "@ff/browser/ManipTarget"
import System from "@ff/graph/System";
import RenderQuadView, { ILayoutChange } from "@ff/scene/RenderQuadView";

import QuadSplitter, { EQuadViewLayout, IQuadSplitterChangeMessage } from "@ff/ui/QuadSplitter";
import CustomElement, { customElement, property } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-content-view")
export default class ContentView extends CustomElement
{
    @property({ attribute: false })
    system: System;

    protected manipTarget: ManipTarget;

    protected view: RenderQuadView = null;
    protected canvas: HTMLCanvasElement = null;
    protected overlay: HTMLDivElement = null;
    protected splitter: QuadSplitter = null;

    constructor(system?: System)
    {
        super();

        this.onResize = this.onResize.bind(this);

        this.system = system;
        this.manipTarget = new ManipTarget();

        this.addEventListener("pointerdown", this.manipTarget.onPointerDown);
        this.addEventListener("pointermove", this.manipTarget.onPointerMove);
        this.addEventListener("pointerup", this.manipTarget.onPointerUpOrCancel);
        this.addEventListener("pointercancel", this.manipTarget.onPointerUpOrCancel);
        this.addEventListener("wheel", this.manipTarget.onWheel);
        this.addEventListener("contextmenu", this.manipTarget.onContextMenu);
    }

    protected firstConnected()
    {
        this.setStyle({
            position: "absolute",
            top: "0", bottom: "0", left: "0", right: "0"
        });

        this.canvas = this.createElement("canvas", {
            display: "block",
            width: "100%",
            height: "100%"
        }, this);

        this.overlay = this.createElement("div", {
            position: "absolute",
            top: "0", bottom: "0", left: "0", right: "0",
            overflow: "hidden"
        }, this);

        this.splitter = this.createElement(QuadSplitter, {
            position: "absolute",
            top: "0", bottom: "0", left: "0", right: "0",
            overflow: "hidden"
        }, this);

        this.splitter.onChange = (message: IQuadSplitterChangeMessage) => {
            this.view.horizontalSplit = message.horizontalSplit;
            this.view.verticalSplit = message.verticalSplit;
        };

        this.view = new RenderQuadView(this.system, this.canvas, this.overlay);
        this.view.on<ILayoutChange>("layout", event => this.splitter.layout = event.layout);

        this.view.layout = EQuadViewLayout.Single;
        this.splitter.layout = EQuadViewLayout.Single;

        //this.view.viewports[0].enableCameraManip(true);
        //this.view.addViewport().setSize(0, 0, 0.5, 1);
        //this.view.addViewport().setSize(0.5, 0, 0.5, 1);

        this.manipTarget.next = this.view;
    }

    protected connected()
    {
        this.view.attach();

        window.addEventListener("resize", this.onResize);
        window.dispatchEvent(new CustomEvent("resize"));
    }

    protected disconnected()
    {
        this.view.detach();

        window.removeEventListener("resize", this.onResize);
    }

    protected onResize()
    {
        this.view.resize();
    }
}