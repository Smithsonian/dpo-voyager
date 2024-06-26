/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import "./Splitter";
import "./Icon";

import CustomElement, { customElement, property, html, TemplateResult } from "./CustomElement";

////////////////////////////////////////////////////////////////////////////////

export type RenderHeaderFunction<T> = (column: ITableColumn<T>, clickHandler: (event: MouseEvent, column: ITableColumn<T>, index: number) => void) => TemplateResult;
export type RenderCellFunction<T> = (row: T, index: number) => string | TemplateResult;
export type SortFunction<T> = (row0: T, row1: T) => number;

export interface ITableColumn<T>
{
    header: string | RenderHeaderFunction<T>;
    cell?: keyof T | RenderCellFunction<T>;
    sortable?: boolean | SortFunction<T>;
    resizable?: boolean;
    width?: number | string;
    className?: string;
}

/**
 * Emitted when the user clicks a table row.
 * @event rowclick
 */
export interface ITableRowClickEvent<T> extends CustomEvent
{
    type: "rowclick";
    target: Table<T>;
    detail: {
        row: T;
        index: number;
    };
}

/**
 * Emitted when the user clicks a table column header.
 * @event colclick
 */
export interface ITableColumnClickEvent<T> extends CustomEvent
{
    type: "colclick";
    target: Table<T>;
    detail: {
        column: T;
    };
}

/**
 * Custom element rendering a table.
 *
 * ### Properties
 * - *rows* - Table row data
 * - *selectedRows* - Single selected row or set of selected rows or null
 * - *columns* - Table column definitions
 * - *placeholder* - Text to display if table is empty (contains no row data)
 * - *resizable* - Table column size can be changed by user if true
 *
 * ### Events
 * - *"rowclick"* - Emits [[ITableRowClickEvent]] when the user clicks on a table row.
 * - *"colclick"* - Emits [[ITableColumnClickEvent]] when the user clicks on a table column header.
 */
@customElement("ff-table")
export default class Table<T> extends CustomElement
{
    @property({ attribute: false })
    rows: T[] = null;

    @property({ attribute: false })
    selectedRows: Set<T> | T = null;

    @property({ attribute: false })
    columns: ITableColumn<T>[] = null;

    @property({ type: String })
    placeholder = "";

    @property({ type: Boolean })
    resizable = false;

    private _sortedRows: T[] = null;
    private _sortColumnIndex = -1;
    private _sortReversed = false;

    constructor()
    {
        super();
        this.onClickHeader = this.onClickHeader.bind(this);
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("ff-table");
    }

    protected getSorter(column: ITableColumn<T>): SortFunction<T>
    {
        if (typeof column.sortable === "function") {
            return column.sortable;
        }

        return (row0: T, row1: T) => {
            // TODO: Need indices to sort by index
            const content0 = this.getCellContent(row0, column, 0);
            const content1 = this.getCellContent(row1, column, 0);

            if (typeof content0 !== "string") {
                return 0;
            }

            return content0 < content1 ? -1 : (content0 > content1 ? 1 : 0);
        }
    }

    protected isRowSelected(row: T): boolean
    {
        if (this.selectedRows && this.selectedRows instanceof Set) {
            return this.selectedRows.has(row);
        }

        return row === this.selectedRows;
    }

    protected renderHeader(column: ITableColumn<T>, index: number): TemplateResult
    {
        const header = column.header;
        const defaultWidth = 1 / this.columns.length;
        const width = typeof column.width === "string" ? column.width : ((column.width || defaultWidth) * 100 + "%");
        let classes = column.className || "";
        let sortIcon = null;

        if (column.sortable) {
            classes += " ff-sortable";
        }

        if (this._sortColumnIndex === -1 && column.sortable) {
            this._sortColumnIndex = index;
        }

        if (this._sortColumnIndex === index) {
            const sorter = this.getSorter(column);
            if (sorter) {
                if (this._sortReversed) {
                    this._sortedRows.sort((row0, row1) => sorter(row1, row0));
                }
                else {
                    this._sortedRows.sort(sorter);
                }

                sortIcon = html`<ff-icon class="ff-table-sort-icon" name="${this._sortReversed ? "caret-up" : "caret-down"}"></ff-icon>`;
            }
        }

        if (typeof header === "string") {
            return html`<th class="ff-table-header ${classes}" style="width: ${width}" @click=${e => this.onClickHeader(e, column, index)}>${header}${sortIcon}</th>`;
        }

        return header(column, this.onClickHeader);
    }

    protected renderRow(row: T, index: number): TemplateResult
    {
        const columns = this.columns;
        const selected = this.isRowSelected(row);

        return html`<tr ?selected=${selected} @click=${e => this.onClickRow(e, row, index)}>${columns.map(column =>
                this.renderCell(row, column, index, selected))}</tr>`;
    }

    protected renderCell(row: T, column: ITableColumn<T>, index: number, selected: boolean): TemplateResult
    {
        const content = this.getCellContent(row, column, index);

        if (typeof content === "string") {
            const classes = column.className || "";
            return html`<td class="ff-table-cell ${classes}">${content}</td>`;
        }

        return content;
    }

    protected getCellContent(row: T, column: ITableColumn<T>, index: number): string | TemplateResult
    {
        const cell: any = column.cell;

        if (typeof cell === "string") {
            return row[cell];
        }

        return cell(row, index);
    }

    protected render()
    {
        if (!this.rows || !this.columns) {
            return html`<div class="ff-placeholder"><div class="ff-text">${this.placeholder}</div></div>`;
        }

        const rows = this._sortedRows = this.rows.slice();
        const columns = this.columns;

        return html`<table><thead><tr>${columns.map((column, index) => this.renderHeader(column, index))}</tr></thead>
            <tbody>${rows.map((row, index) => this.renderRow(row, index))}</tbody></table>`;
    }

    protected onClickHeader(event: MouseEvent, column: ITableColumn<T>, index: number)
    {
        if (column.sortable) {
            if (this._sortColumnIndex === index) {
                this._sortReversed = !this._sortReversed;
            }
            else {
                this._sortColumnIndex = index;
                this._sortReversed = false;
            }

            this.requestUpdate();
        }

        this.dispatchEvent(new CustomEvent("colclick", {
            detail: { column }
        }));
    }

    protected onClickRow(event: MouseEvent, row: T, index: number)
    {
        this.dispatchEvent(new CustomEvent("rowclick", {
            detail: { row, index }
        }));
    }

}
