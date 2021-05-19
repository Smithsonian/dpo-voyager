/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import moment from "moment";

import System from "@ff/graph/System";

import "@ff/ui/Table";
import Table, { ITableColumn, ITableRowClickEvent } from "@ff/ui/Table";

import "@ff/ui/Splitter";
import "@ff/ui/Button";

import "@ff/ui/LineEdit";
import { ILineEditChangeEvent } from "@ff/ui/LineEdit";

import "@ff/ui/TextEdit";
import { ITextEditChangeEvent } from "@ff/ui/TextEdit";

import { INote } from "client/schema/meta";

import NodeView, { customElement, html } from "../explorer/NodeView";
import NVNode from "../../nodes/NVNode";
import CVMeta from "../../components/CVMeta";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-notes-panel")
export default class NotesPanel extends NodeView
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

    protected notes: INote[] = null;
    protected activeNote: INote = null;

    constructor(system?: System)
    {
        super(system);

        this.noteTable = new Table<INote>();
        this.noteTable.columns = NotesPanel.tableColumns;
        this.noteTable.placeholder = "No notes available.";
        this.noteTable.addEventListener("rowclick", this.onClickTableRow.bind(this));
    }

    protected firstConnected()
    {
        this.classList.add("sv-scrollable", "sv-panel", "sv-notes-panel");
    }

    protected renderNote(note: INote)
    {
        if (!note) {
            return html`<div class="ff-placeholder">
                <div>Select or create a note to edit it.</div>
            </div>`;
        }

        const date = moment(note.date).format("YYYY-MM-DD HH:mm:ss");

        return html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <div class="sv-note-field">Created on ${date}</div>
            <ff-line-edit text=${note.user} placeholder="User" @change=${this.onEditUser}></ff-line-edit>
            <ff-text-edit text=${note.text} placeholder="Comment" @change=${this.onEditText}></ff-text-edit>
            </div>
        </div>`;
    }

    protected render()
    {
        const node = this.activeNode;

        if (!node || !(node.scene || node.model)) {
            return html`<div class="ff-placeholder">
                <div>Please select a scene or model to display its notes.</div>
            </div>`;
        }

        this.getNotes();

        const activeNote = this.activeNote;
        const noteTable = this.noteTable;
        noteTable.rows = this.notes || [];
        noteTable.selectedRows = activeNote;
        noteTable.requestUpdate();

        return html`<div class="sv-panel-header">
            <ff-button text="Add Note" icon="create" @click=${this.onClickCreate}></ff-button>
            <ff-button text="Delete Note" icon="trash" ?disabled=${!activeNote} @click=${this.onClickDelete}></ff-button>
        </div>
        <div class="ff-flex-item-stretch ff-flex-row">
            <div class="ff-splitter-section" style="flex-basis: 60%">
                <div class="ff-scroll-y ff-flex-column">${noteTable}</div>
            </div>
            <ff-splitter></ff-splitter>
            <div class="ff-splitter-section" style="flex-basis: 40%">
                ${this.renderNote(activeNote)}
            </div>
        </div>`;
    }

    protected onEditUser(event: ILineEditChangeEvent)
    {
        this.activeNote.user = event.detail.text;
        this.requestUpdate();
    }

    protected onEditText(event: ITextEditChangeEvent)
    {
        this.activeNote.text = event.detail.text;
        this.requestUpdate();
    }

    protected onClickTableRow(event: ITableRowClickEvent<INote>)
    {
        this.activeNote = event.detail.row;

        this.requestUpdate();
        setTimeout(() => (this.getElementsByTagName("ff-text-edit").item(0) as HTMLElement).focus(), 0);
    }

    protected onClickCreate()
    {
        this.getOrCreateNotes();

        const note: INote = { date: new Date().toISOString(), user: "", text: "" };
        this.notes.push(note);
        this.activeNote = note;

        this.requestUpdate();
        setTimeout(() => (this.getElementsByTagName("ff-line-edit").item(0) as HTMLElement).focus(), 0);
    }

    protected onClickDelete()
    {
        const index = this.notes.indexOf(this.activeNote);
        if (index >= 0) {
            this.notes.splice(index, 1);
        }

        this.activeNote = this.notes[index] || null;
        this.requestUpdate();
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        this.notes = null;
        this.activeNote = null;

        this.requestUpdate();
    }

    protected getNotes()
    {
        const node = this.activeNode;
        if (!node) {
            return;
        }

        const process = node.meta && node.meta.process;

        if (process) {
            this.notes = process.get("notes");
            if (this.notes && !this.activeNote) {
                this.activeNote = this.notes[0];
            }
        }
    }

    protected getOrCreateNotes()
    {
        this.notes = null;
        this.activeNote = null;

        const node = this.activeNode;
        if (!node) {
            return;
        }

        if (!node.meta && (node.scene || node.model)) {
            node.createComponent(CVMeta);
        }

        const process = node.meta && node.meta.process;

        if (process) {
            this.notes = process.getOrCreate("notes", []);
        }
    }
}