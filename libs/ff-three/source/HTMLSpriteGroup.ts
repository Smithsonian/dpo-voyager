/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
    Object3D,
    Camera,
} from "three";

import HTMLSprite from "./HTMLSprite";

////////////////////////////////////////////////////////////////////////////////

export { HTMLSprite };

interface IViewport{
    x: number;
    y: number;
    width: number;
    height: number;
    overlay: HTMLElement;
}

/**
 * THREE 3D object, grouping a number of HTML sprites.
 */
export default class HTMLSpriteGroup extends Object3D
{
    readonly isHTMLSpriteGroup = true;

    private _visible = true;

    getVisible() {
        return this._visible;
    }
    setVisible(visible: boolean) {
        if (visible !== this._visible) {
            this._visible = visible;

            const children = this.children as HTMLSprite[];
            for (let i = 0, n = children.length; i < n; ++i) {
                children[i].setVisible(visible);
            }
        }
    }

    /**
     * Disposes of the group including all sprite objects and HTML elements.
     */
    dispose()
    {
        const children = this.children as HTMLSprite[];
        for (let i = 0, n = children.length; i < n; ++i) {
            children[i].dispose();
        }
    }

    /**
     * Must be called if the container element is removed. Disposes of all sprite HTML elements
     * attached to the container.
     * @param container The HTML container element to be removed.
     */
    disposeHTMLElements(container: HTMLElement)
    {
        const children = this.children as HTMLSprite[];
        for (let i = 0, n = children.length; i < n; ++i) {
            children[i].disposeHTMLElement(container);
        }
    }

    /**
     * If necessary, adds HTML elements for all sprites to the given HTML container element.
     * Updates existing elements according to each sprite's position.
     * @param container HTML container element for the HTML elements.
     * @param camera The camera used to render the 3D scene.
     */
    render(container :HTMLElement, camera: Camera)
    {
        if (!this.visible) {
            return;
        }
        //Only get bounds once to prevent forced reflows while looping
        const bounds = container.getBoundingClientRect();

        const children = this.children as HTMLSprite[];
        for (let i = 0, n = children.length; i < n; ++i) {
            const child = children[i];
            const element = child.getHTMLElement(container);
            if (element) {
                child.renderHTMLElement(element, bounds, camera);
            }
        }
    }

    /**
     * Calls update on all sprites in the group.
     */
    update()
    {
        const children = this.children as HTMLSprite[];
        for (let i = 0, n = children.length; i < n; ++i) {
            children[i].update();
        }
    }
}