/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CustomElement, { customElement, property, PropertyValues } from "./CustomElement";

////////////////////////////////////////////////////////////////////////////////

export type GridJustifyItems = "start" | "end" | "center" | "stretch";
export type GridAlignItems = GridJustifyItems;
export type GridJustifyContent = "start" | "end" | "center" | "stretch" | "space-around" | "space-between" | "space-evenly";
export type GridAlignContent = GridJustifyContent;

@customElement("ff-grid")
export default class Grid extends CustomElement
{
    /** How the container is positioned with respect to its parent. Default is "relative". */
    @property({ type: String })
    position: string = undefined;
    /** Defines the columns in the grid with a space-separated list of values.  */
    @property({ type: String })
    columns: string = undefined;
    /** Defines the rows in the grid with a space-separated list of values.  */
    @property({ type: String })
    rows: string = undefined;
    /** Size of additional, auto-created columns.  */
    @property({ type: String })
    autoColumns: string = undefined;
    /** Size of additional, auto-created rows. */
    @property({ type: String })
    autoRows: string = undefined;
    /** Size of the gap between columns. */
    @property({ type: String })
    columnGap: string = undefined;
    /** Size of the gap between rows. */
    @property({ type: String })
    rowGap: string = undefined;
    /** How items are laid out horizontally. */
    @property({ type: String })
    justifyItems: GridJustifyItems = undefined;
    /** How items are laid out vertically. */
    @property({ type: String })
    alignItems: GridAlignItems = undefined;
    /** How the entire grid content is laid out horizontally. */
    @property({ type: String })
    justifyContent: GridJustifyContent = undefined;
    /** How the entire grid content is laid out vertically. */
    @property({ type: String })
    alignContent: GridAlignContent = undefined;

    protected update(changedProperties: PropertyValues): void
    {
        const style = this.style;

        if (changedProperties.has("position") && this.position) {
            switch(this.position) {
                case "fill":
                    style.position = "absolute";
                    style.top = "0";
                    style.right = "0";
                    style.bottom = "0";
                    style.left = "0";
                    break;

                case "relative":
                    style.position = "relative";
                    break;

                case "absolute":
                    style.position = "absolute";
                    break;
            }
        }

        if (changedProperties.has("columns") && this.columns) {
            style.gridTemplateColumns = this.columns;
        }
        if (changedProperties.has("rows") && this.rows) {
            style.gridTemplateRows = this.rows;
        }
        if (changedProperties.has("autoColumns") && this.autoColumns) {
            style.gridAutoColumns = this.autoColumns;
        }
        if (changedProperties.has("autoRows") && this.autoRows) {
            style.gridAutoRows = this.autoRows;
        }
        if (changedProperties.has("columnGap") && this.columnGap) {
            style.gridColumnGap = this.columnGap;
        }
        if (changedProperties.has("rowGap") && this.rowGap) {
            style.gridRowGap = this.rowGap;
        }
        if (changedProperties.has("justifyItems") && this.justifyItems) {
            style.justifyItems = this.justifyItems;
        }
        if (changedProperties.has("alignItems") && this.alignItems) {
            style.alignItems = this.alignItems;
        }
        if (changedProperties.has("justifyContent") && this.justifyContent) {
            style.justifyContent = this.justifyContent;
        }
        if (changedProperties.has("alignContent") && this.alignContent) {
            style.alignContent = this.alignContent;
        }

        super.update(changedProperties);
    }

    protected firstUpdated()
    {
        this.style.display = "grid";

        this.classList.add("ff-grid");
    }
}
