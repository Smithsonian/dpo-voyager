/**
 * Stand-ins for what the browser and Explorer's UI provide to the components under test.
 */

// happy-dom has no Web Audio API, which CVAudioManager creates a context of
if (!globalThis.AudioContext) {
    globalThis.AudioContext = class { close() {} decodeAudioData() {} } as any;
}

/** A viewer's host element, with the elements of Explorer's shadow DOM some components look up. */
export function createViewerRoot(): HTMLElement
{
    const root = document.createElement("div");
    root.attachShadow({ mode: "open" }).innerHTML =
        `<div id="sceneview-sr"></div><div class="sv-tag-buttons"></div><div class="ff-viewport-overlay"></div>`;
    return root;
}
