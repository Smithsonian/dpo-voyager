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
import { ITableColumn, ITableRowSelectEvent } from "@ff/ui/Table";

import "@ff/ui/Splitter";
import "@ff/ui/Button";
import "@ff/ui/TextEdit";

import { INote } from "common/types/item";

import CVItemManager, { IActiveItemEvent } from "../../explorer/components/CVItemManager";

import SystemElement, { customElement, html } from "./SystemElement";
import CVProcess from "../../explorer/components/CVProcess";

////////////////////////////////////////////////////////////////////////////////

export interface ILogEntry
{
    date: Date;
    user: string;
    message: string;
}

@customElement("sv-notes-panel")
export default class NotesPanel extends SystemElement
{
    protected static tableColumns: ITableColumn<INote>[] = [
        { header: "Date", cell: "date", width: 0.3 },
        { header: "User", cell: "user", width: 0.3 },
        { header: "Text", cell: "text", width: 0.4 },
    ];

    protected selectedNote: INote = null;

    protected get itemManager() {
        return this.system.getComponent(CVItemManager);
    }
    protected get process() {
        const activeItem = this.itemManager.activeItem;
        return activeItem ? activeItem.getComponent(CVProcess, true) : null;
    }

    protected firstConnected()
    {
        this.classList.add("sv-scrollable", "sv-panel", "sv-notes-panel");
    }

    protected connected()
    {
        super.connected();
        this.itemManager.on<IActiveItemEvent>("active-item", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.itemManager.off<IActiveItemEvent>("active-item", this.performUpdate, this);
        super.disconnected();
    }

    protected renderList(notes: INote[])
    {
        const selection = new Set(this.selectedNote ? [ this.selectedNote ] : null);

        return html`<ff-table selectable
            .columns=${NotesPanel.tableColumns} .rows=${notes} .selectedRows=${selection} @select=${this.onSelectTableRow}
            placeholder="No notes available."></ff-table>`;
    }

    protected renderNote(note: INote)
    {
        if (!note) {
            return html`<div class="ff-placeholder">
                <div>Select or create a note to edit it.</div>
            </div>`;
        }

        return html`<div class="ff-flex-column">
            <div class="ff-flex-row">
                <div>${note.date}</div><div>${note.user}</div>
            </div><ff-text-edit text=${note.text}></ff-text-edit>
        </div>`;
    }

    protected render()
    {
        const process = this.process;
        if (!process) {
            return html`<div class="ff-placeholder">
                <div>Please select an item to display its notes.</div>
            </div>`;
        }

        const notes = process.get("notes") as INote[];
        const hasNotes = notes && notes.length > 0;

        return html`<div class="sv-panel-content">
                <div class="sv-list">${this.renderList(notes)}</div>
                <ff-splitter></ff-splitter>
                <div class="ff-flex-column sv-details">
                    <div class="sv-commands">
                        <ff-button text="Add Note" icon="create" @click=${this.onClickCreate}></ff-button>
                        <ff-button text="Delete Note" icon="trash" ?disabled=${hasNotes} @click=${this.onClickDelete}></ff-button>
                    </div>
                    ${this.renderNote(this.selectedNote)}
                </div>
            </div>`;
    }

    protected onSelectTableRow(event: ITableRowSelectEvent<INote>)
    {
        this.selectedNote = event.detail.selected ? event.detail.row : null;
        this.requestUpdate();
    }

    protected onClickCreate()
    {
        const process = this.process;
        let notes: INote[] = process.get("notes");

        if (!notes) {
            notes = [];
            process.set("notes", notes);
        }

        const note: INote = { date: new Date().toISOString(), user: "User", text: "New Note" };
        notes.push(note);
        this.selectedNote = note;
        this.requestUpdate();
    }

    protected onClickDelete()
    {

    }
}