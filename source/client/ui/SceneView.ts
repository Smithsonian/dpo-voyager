/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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
import CVOrbitNavigation, { EKeyNavMode } from "client/components/CVOrbitNavigation";
import CVSetup from "client/components/CVSetup";
import {getFocusableElements, focusTrap} from "../utils/focusHelpers";

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
    protected srAnnouncement: HTMLDivElement = null;
    protected splitter: QuadSplitter = null;
    protected resizeObserver: ResizeObserver = null;

    protected pointerEventsEnabled: boolean = false;
    protected measuring: boolean = false;

    getView() : RenderQuadView
    {
        return this.view;
    }

    constructor(system?: System)
    {
        super(system);

        //this.onResize = this.onResize.bind(this);
        this.onPointerUpOrCancel = this.onPointerUpOrCancel.bind(this);
        this.onKeyDownOverlay = this.onKeyDownOverlay.bind(this);

        this.manipTarget = new ManipTarget();

        this.addEventListener("pointerdown", this.onPointerDown);
        this.addEventListener("pointermove", this.manipTarget.onPointerMove);
        this.addEventListener("pointerup", this.onPointerUpOrCancel);
        this.addEventListener("pointercancel", this.onPointerUpOrCancel);
        this.ownerDocument.addEventListener("pointermove", this.manipTarget.onPointerMove);         // To catch out of frame drag releases
        this.ownerDocument.addEventListener("pointerup", this.onPointerUpOrCancel);     // To catch out of frame drag releases
        this.ownerDocument.addEventListener("pointercancel", this.onPointerUpOrCancel); // To catch out of frame drag releases
        this.addEventListener("wheel", this.manipTarget.onWheel);
        this.addEventListener("contextmenu", this.manipTarget.onContextMenu);
        this.addEventListener("keydown", this.manipTarget.onKeyDown);

        this.pointerEventsEnabled = true;
    }

    protected firstConnected()
    {
        this.classList.add("sv-scene-view");

        // disable default touch action on mobile devices
        this.style.touchAction = "none";
        this.setAttribute("touch-action", "none"); 

        this.tabIndex = 0;
        this.id = "sv-scene"
        this.ariaLabel = "Interactive 3D Model. Use mouse, touch, or arrow keys to rotate. Escape key to exit annotations.";
        this.setAttribute("role", "application"),

        // Add screen readertext only element
        this.srAnnouncement = this.appendElement("div");
        this.srAnnouncement.classList.add("sr-only");
        this.srAnnouncement.setAttribute("aria-live", "polite");
        this.srAnnouncement.setAttribute("id", "sceneview-sr");

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
        this.overlay.addEventListener("keydown", this.onKeyDownOverlay);

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
        this.view.on<ILayoutChange>("layout", event => {this.splitter.layout = event.layout; this.dispatchEvent(new CustomEvent("layout"))});

        this.view.layout = EQuadViewLayout.Single;
        this.splitter.layout = EQuadViewLayout.Single;

        this.manipTarget.next = this.view;
    }

    protected connected()
    {
        this.view.attach();

        if(!this.resizeObserver) {
            this.resizeObserver = new ResizeObserver(() => this.view.resize());
        }
        
        this.resizeObserver.observe(this.view.renderer.domElement);
        
        this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.navigation.ins.pointerEnabled.on("value", this.enablePointerEvents, this);
        this.system.getComponent(CVOrbitNavigation).ins.keyNavActive.on("value", this.onKeyboardNavigation, this);
        this.system.getComponent(CVSetup).tape.ins.enabled.on("value", this.onMeasure, this);
    }

    protected disconnected()
    {
        this.resizeObserver.disconnect();

        this.system.getComponent(CVSetup).tape.ins.enabled.off("value", this.onMeasure, this);
        this.system.getComponent(CVOrbitNavigation).ins.keyNavActive.off("value", this.onKeyboardNavigation, this);
        this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.navigation.ins.pointerEnabled.off("value", this.enablePointerEvents, this);

        this.view.detach();
    }

    protected enablePointerEvents() {
        const needsEnabled = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.navigation.ins.pointerEnabled.value;

        if(needsEnabled && !this.pointerEventsEnabled) {
            this.addEventListener("pointerdown", this.onPointerDown);
            this.addEventListener("pointermove", this.manipTarget.onPointerMove);
            this.addEventListener("pointerup", this.onPointerUpOrCancel);
            this.addEventListener("pointercancel", this.onPointerUpOrCancel);
            this.ownerDocument.addEventListener("pointermove", this.manipTarget.onPointerMove);         // To catch out of frame drag releases
            this.ownerDocument.addEventListener("pointerup", this.onPointerUpOrCancel);     // To catch out of frame drag releases
            this.ownerDocument.addEventListener("pointercancel", this.onPointerUpOrCancel); // To catch out of frame drag releases
            this.addEventListener("wheel", this.manipTarget.onWheel);
            this.addEventListener("contextmenu", this.manipTarget.onContextMenu);
            this.addEventListener("keydown", this.manipTarget.onKeyDown);

            // disable default touch action on mobile devices
            this.style.touchAction = "none";
            this.setAttribute("touch-action", "none");

            this.pointerEventsEnabled = true;
        }
        else if(!needsEnabled && this.pointerEventsEnabled) {
            this.removeEventListener("pointerdown", this.onPointerDown);
            this.removeEventListener("pointermove", this.manipTarget.onPointerMove);
            this.removeEventListener("pointerup", this.onPointerUpOrCancel);
            this.removeEventListener("pointercancel", this.onPointerUpOrCancel);
            this.ownerDocument.removeEventListener("pointermove", this.manipTarget.onPointerMove);         // To catch out of frame drag releases
            this.ownerDocument.removeEventListener("pointerup", this.onPointerUpOrCancel);     // To catch out of frame drag releases
            this.ownerDocument.removeEventListener("pointercancel", this.onPointerUpOrCancel); // To catch out of frame drag releases
            this.removeEventListener("wheel", this.manipTarget.onWheel);
            this.removeEventListener("contextmenu", this.manipTarget.onContextMenu);
            this.removeEventListener("keydown", this.manipTarget.onKeyDown);

            // enable default touch action on mobile devices
            this.style.touchAction = "auto";
            this.setAttribute("touch-action", "auto");

            this.pointerEventsEnabled = false;
            this.style.cursor = "default";
        }
    }

    protected onPointerDown(event: PointerEvent) {
        if(this.pointerEventsEnabled) {
            this.style.cursor = this.style.cursor == "default" ? "default" : "grabbing";
            this.manipTarget.onPointerDown(event);
        }
    }

    protected onPointerUpOrCancel(event: PointerEvent) {
        if(this.pointerEventsEnabled) {
            this.style.cursor = this.style.cursor == "default" ? "default" : "grab";
            this.manipTarget.onPointerUpOrCancel(event);
        }
    }

    protected onKeyboardNavigation() {
        const navIns = this.system.getComponent(CVOrbitNavigation).ins;
        const activeNavMode = navIns.keyNavActive.value;
        switch(activeNavMode) {
            case EKeyNavMode.Orbit:
                this.srAnnouncement.textContent = "Orbit " + navIns.orbit.value[0].toFixed(0) + ", " + 
                    navIns.orbit.value[1].toFixed(0) + ", " + navIns.orbit.value[2].toFixed(0);
                break;
            case EKeyNavMode.Pan:
            case EKeyNavMode.Zoom:
                this.srAnnouncement.textContent = "Offset " + navIns.offset.value[0].toFixed(0) + ", " +
                    navIns.offset.value[1].toFixed(0) + ", " + navIns.offset.value[2].toFixed(0);
        }
    }

    protected onMeasure() {
        this.measuring = this.system.getComponent(CVSetup).tape.ins.enabled.value;
        this.style.cursor = this.measuring ? "default" : "grab";
    }

    protected onKeyDownOverlay(e: KeyboardEvent)
    {
        const viewer = this.system.getComponent(CVSetup).viewer;
        if (e.code === "Escape") {
            e.preventDefault();
            if(viewer.outs.tagCloud.value.length > 0) {
                const tagElement = viewer.rootElement.shadowRoot.querySelector('.sv-tag-buttons');
                const elem = tagElement.getElementsByClassName("ff-button")[0] as HTMLElement;
                if(elem) {
                    elem.focus();
                }
            }
            else {
                this.system.getComponent(CVSetup).viewer.ins.annotationExit.set();
            }
        }
        else if(e.code === "Tab") {
            focusTrap(getFocusableElements(this.overlay) as HTMLElement[], e, true);
        }
    }

    /*protected onResize()
    {
        this.view.resize();
    }*/
}