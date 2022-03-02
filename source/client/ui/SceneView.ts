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

import ManipTarget from "@ff/browser/ManipTarget"
import System from "@ff/graph/System";
import RenderQuadView, { ILayoutChange } from "@ff/scene/RenderQuadView";
import SystemView, { customElement } from "@ff/scene/ui/SystemView";

import QuadSplitter, { EQuadViewLayout, IQuadSplitterChangeMessage } from "@ff/ui/QuadSplitter";
import CVDocumentProvider from "client/components/CVDocumentProvider";

////////////////////////////////////////////////////////////////////////////////

/**
 * Displays up to four viewports rendering 3D content from a node/component system.
 * The built-in quad split functionality provides four different layouts: single view, horizontal split,
 * vertical split, and quad split. The split proportions can be adjusted by moving the split handles
 * between viewports.
 */
@customElement("sv-scene-view")
export default class SceneView extends SystemView
{
    protected manipTarget: ManipTarget;

    protected view: RenderQuadView = null;
    protected canvas: HTMLCanvasElement = null;
    protected overlay: HTMLDivElement = null;
    protected splitter: QuadSplitter = null;
    protected resizeObserver: ResizeObserver = null;

    protected pointerEventsEnabled: boolean = false;

    constructor(system?: System)
    {
        super(system);

        //this.onResize = this.onResize.bind(this);

        this.manipTarget = new ManipTarget();

        this.addEventListener("pointerdown", this.manipTarget.onPointerDown);
        this.addEventListener("pointermove", this.manipTarget.onPointerMove);
        this.addEventListener("pointerup", this.manipTarget.onPointerUpOrCancel);
        this.addEventListener("pointercancel", this.manipTarget.onPointerUpOrCancel);
        this.ownerDocument.addEventListener("pointermove", this.manipTarget.onPointerMove);         // To catch out of frame drag releases
        this.ownerDocument.addEventListener("pointerup", this.manipTarget.onPointerUpOrCancel);     // To catch out of frame drag releases
        this.ownerDocument.addEventListener("pointercancel", this.manipTarget.onPointerUpOrCancel); // To catch out of frame drag releases
        this.addEventListener("wheel", this.manipTarget.onWheel);
        this.addEventListener("contextmenu", this.manipTarget.onContextMenu);

        this.pointerEventsEnabled = true;
    }

    protected firstConnected()
    {
        this.classList.add("sv-scene-view");

        // disable default touch action on mobile devices
        this.style.touchAction = "none";
        this.setAttribute("touch-action", "none");

        this.canvas = this.appendElement("canvas", {
            display: "block",
            width: "100%",
            height: "100%"
        });

        this.overlay = this.appendElement("div", {
            position: "absolute",
            top: "0", bottom: "0", left: "0", right: "0",
            overflow: "hidden"
        });

        this.overlay.classList.add("sv-content-overlay");

        this.splitter = this.appendElement(QuadSplitter, {
            position: "absolute",
            top: "0", bottom: "0", left: "0", right: "0",
            overflow: "hidden"
        });

        this.splitter.onChange = (message: IQuadSplitterChangeMessage) => {
            this.view.horizontalSplit = message.horizontalSplit;
            this.view.verticalSplit = message.verticalSplit;
        };

        this.view = new RenderQuadView(this.system, this.canvas, this.overlay);
        this.view.on<ILayoutChange>("layout", event => this.splitter.layout = event.layout);

        this.view.layout = EQuadViewLayout.Single;
        this.splitter.layout = EQuadViewLayout.Single;

        this.manipTarget.next = this.view;
    }

    protected connected()
    {
        this.view.attach();

        //window.addEventListener("resize", this.onResize);
        //window.dispatchEvent(new CustomEvent("resize"));

        this.resizeObserver = new ResizeObserver(() => this.view.resize());
        this.resizeObserver.observe(this.view.renderer.domElement);

        this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.navigation.ins.pointerEnabled.on("value", this.enablePointerEvents, this);
    }

    protected disconnected()
    {
        this.resizeObserver.disconnect();

        this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.navigation.ins.pointerEnabled.off("value", this.enablePointerEvents, this);

        this.view.detach();

        //window.removeEventListener("resize", this.onResize);
    }

    protected enablePointerEvents() {
        const needsEnabled = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.navigation.ins.pointerEnabled.value;

        if(needsEnabled && !this.pointerEventsEnabled) {
            this.addEventListener("pointerdown", this.manipTarget.onPointerDown);
            this.addEventListener("pointermove", this.manipTarget.onPointerMove);
            this.addEventListener("pointerup", this.manipTarget.onPointerUpOrCancel);
            this.addEventListener("pointercancel", this.manipTarget.onPointerUpOrCancel);
            this.ownerDocument.addEventListener("pointermove", this.manipTarget.onPointerMove);         // To catch out of frame drag releases
            this.ownerDocument.addEventListener("pointerup", this.manipTarget.onPointerUpOrCancel);     // To catch out of frame drag releases
            this.ownerDocument.addEventListener("pointercancel", this.manipTarget.onPointerUpOrCancel); // To catch out of frame drag releases
            this.addEventListener("wheel", this.manipTarget.onWheel);
            this.addEventListener("contextmenu", this.manipTarget.onContextMenu);

            // disable default touch action on mobile devices
            this.style.touchAction = "none";
            this.setAttribute("touch-action", "none");

            this.pointerEventsEnabled = true;
        }
        else if(!needsEnabled && this.pointerEventsEnabled) {
            this.removeEventListener("pointerdown", this.manipTarget.onPointerDown);
            this.removeEventListener("pointermove", this.manipTarget.onPointerMove);
            this.removeEventListener("pointerup", this.manipTarget.onPointerUpOrCancel);
            this.removeEventListener("pointercancel", this.manipTarget.onPointerUpOrCancel);
            this.ownerDocument.removeEventListener("pointermove", this.manipTarget.onPointerMove);         // To catch out of frame drag releases
            this.ownerDocument.removeEventListener("pointerup", this.manipTarget.onPointerUpOrCancel);     // To catch out of frame drag releases
            this.ownerDocument.removeEventListener("pointercancel", this.manipTarget.onPointerUpOrCancel); // To catch out of frame drag releases
            this.removeEventListener("wheel", this.manipTarget.onWheel);
            this.removeEventListener("contextmenu", this.manipTarget.onContextMenu);

            // enable default touch action on mobile devices
            this.style.touchAction = "auto";
            this.setAttribute("touch-action", "auto");

            this.pointerEventsEnabled = false;
        }
    }

    /*protected onResize()
    {
        this.view.resize();
    }*/
}