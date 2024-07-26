/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CSelection from "@ff/graph/components/CSelection";

import SystemView, {
    customElement,
    property,
    html,
    PropertyValues,
    TemplateResult
} from "./SystemView";

////////////////////////////////////////////////////////////////////////////////

export { customElement, property, html, PropertyValues, TemplateResult };

export default class SelectionView extends SystemView
{
    protected selection: CSelection = null;

    protected firstConnected()
    {
        this.selection = this.system.getComponent(CSelection);
    }
}