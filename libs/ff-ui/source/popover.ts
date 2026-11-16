/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

////////////////////////////////////////////////////////////////////////////////

export interface IPopoverPlacement
{
    /**
     * Horizontal position: aligned with the anchor's left ("start", default) or
     * right ("end") edge, or at the given viewport coordinate.
     */
    x?: "start" | "end" | number;
    /** Vertical position: below (default) or above the anchor, if it fits there. */
    y?: "below" | "above";
}

/**
 * Shows `element`, which must have a `popover` attribute, next to `anchor`,
 * kept within the viewport. Being in the top layer, it is above everything else
 * and not clipped by the anchor's containers.
 * It follows the anchor on window resizes, until hidden or removed.
 */
export function showPopover(element: HTMLElement, anchor: Element, placement: IPopoverPlacement = {})
{
    element.classList.add("ff-popover");
    element.showPopover();

    const position = () => {
        if (!element.isConnected || !element.matches(":popover-open")) {
            window.removeEventListener("resize", position);
            return;
        }

        const anchorRect = anchor.getBoundingClientRect();
        const rect = element.getBoundingClientRect();

        let x = placement.x === "end" ? anchorRect.right - rect.width
            : typeof placement.x === "number" ? placement.x : anchorRect.left;
        // on the requested side, or the other one if it only fits there
        const above = anchorRect.top - rect.height;
        const below = anchorRect.bottom;
        const fitsAbove = above >= 0;
        const fitsBelow = below + rect.height <= window.innerHeight;
        let y = placement.y === "above"
            ? (!fitsAbove && fitsBelow ? below : above)
            : (!fitsBelow && fitsAbove ? above : below);

        x = Math.max(0, Math.min(x, window.innerWidth - rect.width));
        y = Math.max(0, Math.min(y, window.innerHeight - rect.height));

        element.style.left = Math.round(x) + "px";
        element.style.top = Math.round(y) + "px";
    };

    position();
    window.addEventListener("resize", position);
}
