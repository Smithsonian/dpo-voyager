/**
 * 3D Foundation Project
 * Copyright 2026 Smithsonian Institution
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

/**
 * Whether this document is allowed to go fullscreen.
 * Unlike the mere presence of `requestFullscreen`, this accounts for the embedder's
 * permissions policy: inside an iframe it is false unless the iframe has `allowfullscreen`
 * or an `allow="fullscreen"` directive that matches this document's origin.
 */
export function isFullscreenEnabled(): boolean
{
    return !!document.fullscreenEnabled;
}

/** Whether some element is currently displayed fullscreen. */
export function isFullscreenActive(): boolean
{
    return !!document.fullscreenElement;
}

/** Calls `callback` whenever fullscreen is entered or exited. Returns a function removing the listener. */
export function onFullscreenChange(callback: () => void): () => void
{
    document.addEventListener("fullscreenchange", callback);
    return () => document.removeEventListener("fullscreenchange", callback);
}

/** Leaves fullscreen if active, otherwise displays `element` fullscreen. Rejects if the browser refuses. */
export function toggleFullscreen(element: Element): Promise<void>
{
    if (isFullscreenActive()) {
        return document.exitFullscreen();
    }
    if (!isFullscreenEnabled()) {
        return Promise.reject(new Error("Fullscreen is not allowed in this context"));
    }
    return element.requestFullscreen();
}
