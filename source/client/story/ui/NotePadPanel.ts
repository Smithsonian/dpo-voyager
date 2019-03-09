/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
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

import * as moment from "moment";

import System from "@ff/graph/System";

import "@ff/ui/Table";
import Table, { ITableColumn, ITableRowClickEvent } from "@ff/ui/Table";

import "@ff/ui/Splitter";
import "@ff/ui/Button";

import "@ff/ui/LineEdit";
import { ILineEditChangeEvent } from "@ff/ui/LineEdit";

import "@ff/ui/TextEdit";
import { ITextEditChangeEvent } from "@ff/ui/TextEdit";

import SystemElement, { customElement, html } from "../../core/ui/SystemElement";

import CVNotePad, { INote } from "../components/CVNotePad";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-notepad-panel")
export default class NotePadPanel extends SystemElement
{
    protected static tableColumns: ITableColumn<INote>[] = [
        { header: "Date", width: 0.3,
            cell: row => moment(row.date).format("YYYY-MM-DD HH:mm:ss"),
            sortable: true
        },
        { header: "User", width: 0.25, cell: "user", sortable: true },
        { header: "Text", width: 0.45, cell: "text", sortable: true },
    ];

    protected noteTable: Table<INote>;

    constructor(system?: System)
    {
        super(system);

        this.noteTable = new Table<INote>();
        this.noteTable.columns = NotePadPanel.tableColumns;
        this.noteTable.placeholder = "No notes available.";
        this.noteTable.addEventListener("rowclick", this.onClickTableRow.bind(this));
    }

    protected get notePad() {
        return this.system.getMainComponent(CVNotePad);
    }

    protected firstConnected()
    {
        this.classList.add("sv-scrollable", "sv-panel", "sv-notes-panel");
    }

    protected connected()
    {
        super.connected();
        this.notePad.on("update", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.notePad.off("update", this.performUpdate, this);
        super.disconnected();
    }

    protected renderNote(note: INote)
    {
        if (!note) {
            return html`<div class="ff-placeholder">
                <div>Select or create a note to edit it.</div>
            </div>`;
        }

        const date = moment(note.date).format("YYYY-MM-DD HH:mm:ss");

        return html`<div class="ff-flex-column sv-note">
            <div class="sv-note-field">Created on ${date}</div>
            <ff-line-edit text=${note.user} placeholder="User" @change=${this.onEditUser}></ff-line-edit>
            <ff-text-edit text=${note.text} placeholder="Comment" @change=${this.onEditText}></ff-text-edit>
            </div>
        </div>`;
    }

    protected render()
    {
        const activeItem = this.notePad.itemManager.activeItem;
        if (!activeItem) {
            return html`<div class="ff-placeholder">
                <div>Please select an item to display its notes.</div>
            </div>`;
        }

        const notes = this.notePad.notes;
        const activeNote = this.notePad.activeNote;

        const table = this.noteTable;
        table.rows = notes;
        table.selectedRows = activeNote;
        table.requestUpdate();

        return html`<div class="sv-panel-content">
                <div class="sv-list">${table}</div>
                <ff-splitter></ff-splitter>
                <div class="ff-flex-column sv-details">
                    <div class="sv-panel-header">
                        <ff-button text="Add Note" icon="create" @click=${this.onClickCreate}></ff-button>
                        <ff-button text="Delete Note" icon="trash" ?disabled=${!activeNote} @click=${this.onClickDelete}></ff-button>
                    </div>
                    ${this.renderNote(activeNote)}
                </div>
            </div>`;
    }

    protected onEditUser(event: ILineEditChangeEvent)
    {
        this.notePad.setNote(event.detail.text, this.notePad.activeNote.text);
    }

    protected onEditText(event: ITextEditChangeEvent)
    {
        this.notePad.setNote(this.notePad.activeNote.user, event.detail.text);
    }

    protected onClickTableRow(event: ITableRowClickEvent<INote>)
    {
        this.notePad.activeNote = event.detail.row;
        setTimeout(() => (this.getElementsByTagName("ff-text-edit").item(0) as HTMLElement).focus(), 0);
    }

    protected onClickCreate()
    {
        const note: INote = { date: new Date().toISOString(), user: "", text: "" };
        this.notePad.addNote(note);

        setTimeout(() => (this.getElementsByTagName("ff-line-edit").item(0) as HTMLElement).focus(), 0);
    }

    protected onClickDelete()
    {
        this.notePad.removeActiveNote();
    }
}