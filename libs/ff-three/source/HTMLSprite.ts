/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
    Object3D,
    Camera,
    Vector2,
    Vector3,
    Object3DEventMap,
} from "three";

import CustomElement, { customElement, html } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

export { html };

const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _vec3c = new Vector3();
const _vec3d = new Vector3();
const _vec2a = new Vector2();
const _vec2b = new Vector2();

export enum EQuadrant { TopRight, TopLeft, BottomLeft, BottomRight }

/**
 * A Three.js Object representing a 3D renderable part and a 2D (HTML) part.
 * HTML sprites should have a [[HTMLSpriteGroup]] as their parent.
 */
export default class HTMLSprite<EventMap extends Object3DEventMap = Object3DEventMap> extends Object3D<EventMap>
{
    readonly isHTMLSprite = true;

    viewAngle = 0;
    orientationAngle = 0;
    orientationQuadrant: EQuadrant = EQuadrant.TopLeft;

    private _elements = new Map<HTMLElement, SpriteElement>();
    private _visible = true;

    constructor()
    {
        super();
        this.frustumCulled = false;
    }

    getVisible() {
        return this._visible;
    }
    setVisible(visible: boolean) {
        if (visible !== this._visible && this._elements) {
            this._visible = visible;
            this._elements.forEach(element => {
                if (element) {
                    element.setVisible(visible);
                }
            });
        }
    }

    dispose()
    {
        this._elements.forEach((element, container) => {
            if (element) {
                container.removeChild(element);
            }
        });

        this._elements.clear();
    }

    disposeHTMLElement(container: HTMLElement)
    {
        const element = this._elements.get(container);

        if (element) {
            this._elements.delete(container);
            container.removeChild(element);
        }
    }

    /**
     * Called when the 3D parts of the sprite should be updated because
     * the underlying data has been changed.
     */
    update()
    {
        this._elements.forEach(element => {
            if (element) {
                this.updateHTMLElement(element)
            }
        });
    }

    /**
     * Called when the model-view of the sprite has changed.
     * This updates the position and orientation of the HTML element.
     * @param element The sprite HTML element to be updated.
     * @param container The container holding the sprite element.
     * @param camera The current scene camera.
     * @param anchor The 3D object to which the HTML sprite element is attached.
     * @param offset An offset to be added to the anchor 3D object.
     */
    renderHTMLElement(element: SpriteElement, bounds: DOMRect, camera: Camera, anchor?: Object3D, offset?: Vector3)
    {
        anchor = anchor || this;

        _vec3a.set(0, 0, 0);
        _vec3a.applyMatrix4(anchor.modelViewMatrix);

        offset ? _vec3b.copy(offset) : _vec3b.set(0, 1, 0);
        _vec3b.applyMatrix4(anchor.modelViewMatrix);

        _vec3c.copy(_vec3b).sub(_vec3a).normalize();
        _vec3d.set(0, 0, 1);

        this.viewAngle = _vec3c.angleTo(_vec3d);

        _vec3a.applyMatrix4(camera.projectionMatrix);
        _vec3b.applyMatrix4(camera.projectionMatrix);

        _vec2b.set(_vec3b.x, _vec3b.y);
        _vec2a.set(_vec3a.x, _vec3a.y);
        _vec2b.sub(_vec2a);
        const x = (_vec3b.x + 1) * 0.5 * bounds.width;
        const y = (1 - _vec3b.y) * 0.5 * bounds.height;

        element.setPosition(x, y);

        const angle = this.orientationAngle = _vec2b.angle();
        this.orientationQuadrant = Math.floor(2 * angle / Math.PI);
    }

    getHTMLElement(container: HTMLElement): SpriteElement
    {
        let element = this._elements.get(container);

        if (!element) {
            element = this.createHTMLElement();
            if (element) {
                element.setVisible(this._visible);
                container.appendChild(element);
                this._elements.set(container, element);
            }
        }

        return element;
    }

    /**
     * Called when the sprite becomes visible in a viewport.
     * Override to return a HTML element to visualize the 2D part of the sprite in the viewport.
     * The default implementation returns null, i.e. no HTML elements are created for this sprite.
     */
    protected createHTMLElement(): SpriteElement | null
    {
        return null;
    }

    /**
     * Called when the HTML parts of the sprite should be updated because
     * the underlying data has been changed. This is called once for each viewport
     * the sprite is represented in with a HTML element.
     * Method is not called if the sprite has no HTML element.
     * @param element The HTML element that should be updated.
     */
    protected updateHTMLElement(element: SpriteElement)
    {
        element.requestUpdate();
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("ff-sprite-element")
export class SpriteElement extends CustomElement
{
    setVisible(visible: boolean)
    {
        this.style.display = visible ? "block" : "none";
    }

    setOpacity(opacity: number)
    {
        this.style.opacity = opacity.toString();
        this.style.pointerEvents = opacity > 0 ? "auto" : "none";
    }

    setPosition(x: number, y: number)
    {
        this.style.left = x.toString() + "px";
        this.style.top = y.toString() + "px";
    }
}