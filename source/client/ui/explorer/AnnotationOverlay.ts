/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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

import { html } from "@ff/ui/CustomElement";
import "@ff/ui/Button";

import Modal from "../Modal";
import AnnotationSprite from "client/annotations/AnnotationSprite";

////////////////////////////////////////////////////////////////////////////////

// The popup lives in the scene view's overlay, whose handlers would otherwise act on
// events in it: navigation and picking (pointer, wheel), keyboard navigation, and
// leaving annotations on Escape.
const sceneViewEvents = [ "pointerdown", "pointermove", "pointerup", "pointercancel", "wheel", "keydown" ];

const stopPropagation = (event: Event) => event.stopPropagation();

/**
 * Shows the full content of an annotation in a popup, over the scene view only:
 * the chrome view (titles, menus) stays above it.
 * `content` is the annotation's content element: it is moved into the popup, the
 * caller has to put it back once the returned promise resolves.
 * The popup closes when the annotation's article link is followed.
 */
export function showAnnotationOverlay(parent: HTMLElement, content: HTMLElement, sprite: AnnotationSprite): Promise<void>
{
    const modal = new Modal();
    modal.label = "Annotation pop-up";
    modal.panelClass = "sv-annotation-overlay sv-annotation";

    const close = () => modal.close();

    // the title is rendered after a delay, so that screen readers announce it
    const render = (title: string) => html`<div class="sv-help-region" aria-live="polite" aria-atomic="true">
            <div class="ff-flex-row">
                <div class="ff-flex-spacer ff-title"><b>${title}</b></div>
                <ff-button icon="close" transparent class="ff-close-button" title="Close" autofocus @click=${close}></ff-button>
            </div>
            ${content}
        </div>`;

    modal.content = render("");
    const timer = window.setTimeout(() => { modal.content = render(sprite.annotation.title); }, 100);

    sceneViewEvents.forEach(type => modal.addEventListener(type, stopPropagation));
    sprite.addEventListener("link", close);

    return modal.openIn(parent).then(() => {
        window.clearTimeout(timer);
        sprite.removeEventListener("link", close);
    });
}
