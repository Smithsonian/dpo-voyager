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

import "@ff/ui/Table";
import { ITableColumn, ITableRowClickEvent } from "@ff/ui/Table";

import "@ff/ui/Splitter";
import "@ff/ui/Button";
import "@ff/ui/TextEdit";

import CVNotePad, { INote, INotesUpdateEvent } from "../components/CVNotePad";

import SystemElement, { customElement, html } from "./SystemElement";
import { ITextEditChangeEvent } from "@ff/ui/TextEdit";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-notepad-panel")
export default class NotePadPanel extends SystemElement
{
    protected static tableColumns: ITableColumn<INote>[] = [
        { header: "Date", width: 0.33,
            cell: row => new Date(row.date).toLocaleString(),
            sortable: (row0, row1) => {
                const d0 = new Date(row0.date);
                const d1 = new Date(row1.date);
                return d0 < d1 ? -1 : (d0 > d1 ? 1 : 0);
            } },
        { header: "User", width: 0.33, cell: "user", sortable: true },
        { header: "Text", width: 0.34, cell: "text", sortable: true },
    ];

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
        this.notePad.on<INotesUpdateEvent>("notes-update", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.notePad.off<INotesUpdateEvent>("notes-update", this.performUpdate, this);
        super.disconnected();
    }

    protected renderList(notes: INote[])
    {
        const activeNote = this.notePad.activeNote;

        return html`<ff-table
            .columns=${NotePadPanel.tableColumns} .rows=${notes} .selectedRows=${activeNote} @rowclick=${this.onClickTableRow}
            placeholder="No notes available."></ff-table>`;
    }

    protected renderNote(note: INote)
    {
        if (!note) {
            return html`<div class="ff-placeholder">
                <div>Select or create a note to edit it.</div>
            </div>`;
        }

        const dateText = new Date(note.date).toLocaleString();

        return html`<div class="ff-flex-column sv-note">
            <div class="sv-note-field">Date: ${dateText}</div>
            <div class="sv-note-field">User: ${note.user}</div>
            <ff-text-edit text=${note.text} @change=${this.onEditText}></ff-text-edit>
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

        return html`<div class="sv-panel-content">
                <div class="sv-list">${this.renderList(notes)}</div>
                <ff-splitter></ff-splitter>
                <div class="ff-flex-column sv-details">
                    <div class="sv-commands">
                        <ff-button text="Add Note" icon="create" @click=${this.onClickCreate}></ff-button>
                        <ff-button text="Delete Note" icon="trash" ?disabled=${!activeNote} @click=${this.onClickDelete}></ff-button>
                    </div>
                    ${this.renderNote(activeNote)}
                </div>
            </div>`;
    }

    protected onEditText(event: ITextEditChangeEvent)
    {
        this.notePad.setText(event.detail.text);
    }

    protected onClickTableRow(event: ITableRowClickEvent<INote>)
    {
        this.notePad.activeNote = event.detail.row;
    }

    protected onClickCreate()
    {
        const note: INote = { date: new Date().toISOString(), user: "User", text: "New Note" };
        this.notePad.addNote(note);
    }

    protected onClickDelete()
    {
        this.notePad.removeActiveNote();
    }
}