/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Component, { Node, types } from "@ff/graph/Component";
import { IRenderContext } from "./CScene";

////////////////////////////////////////////////////////////////////////////////

export { Node, types };

export default class CRenderable extends Component
{
    static readonly typeName: string = "CRenderable";

    /**
     * This is called right before the graph's scene is rendered to a specific viewport/view.
     * Override to make adjustments specific to the renderer, view or viewport.
     * @param context
     */
    preRender(context: IRenderContext)
    {
    }

    /**
     * This is called right after the graph's scene has been rendered to a specific viewport/view.
     * Override to make adjustments specific to the renderer, view or viewport.
     * @param context
     */
    postRender(context: IRenderContext)
    {
    }
}

CRenderable.prototype.preRender = null;
CRenderable.prototype.postRender = null;