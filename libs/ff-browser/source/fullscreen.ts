/**
 * FF Typescript Foundation Library
 * Copyright 2021 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

/**
 * Puts the given HTML element in fullscreen mode.
 * If no element is provided and currently in fullscreen mode, exits fullscreen mode.
 * @param {HTMLElement | null} element The element to present in fullscreen mode. Exits fullscreen mode if null.
 */
export default function fullscreen(element: HTMLElement | null) : void
{
    let elem: any = element;

    if (!elem) {
        document.exitFullscreen();
    }
    else {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }
    }
}