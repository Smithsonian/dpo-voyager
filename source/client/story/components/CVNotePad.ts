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

import Component, { ITypedEvent, types } from "@ff/graph/Component";

import NVItem from "../../explorer/nodes/NVItem";
import CVItemManager, { IActiveItemEvent } from "../../explorer/components/CVItemManager";

////////////////////////////////////////////////////////////////////////////////

export interface INote
{
    date: string;
    user: string;
    text: string;
}

/**
 * Emitted after the set of notes has changed.
 * @event
 */
export interface INotesUpdateEvent extends ITypedEvent<"notes-update">
{
}

export default class CVNotePad extends Component
{
    static readonly typeName: string = "CVNotePad";

    private _notes: INote[] = [];
    private _activeNote: INote = null;

    get notes() {
        return this._notes;
    }
    get activeNote() {
        return this._activeNote;
    }
    set activeNote(note: INote) {
        if (note !== this._activeNote) {
            this._activeNote = note;
            this.emitUpdateEvent();
        }
    }
    get itemManager() {
        return this.getMainComponent(CVItemManager);
    }

    addNote(note: INote)
    {
        this._notes.push(note);
        this.activeNote = note;
    }

    setText(text: string)
    {
        if (this.activeNote) {
            this.activeNote.text = text;
            this.emitUpdateEvent();
        }
    }

    removeActiveNote()
    {
        if (this._activeNote) {
            const index = this._notes.indexOf(this._activeNote);
            this._notes.splice(index, 1);
            this.activeNote = this._notes[Math.min(index, this._notes.length - 1)];
        }
    }

    create()
    {
        super.create();
        this.itemManager.on<IActiveItemEvent>("active-item", this.onActiveItem, this);
    }

    dispose()
    {
        this.itemManager.off<IActiveItemEvent>("active-item", this.onActiveItem, this);
        super.dispose();
    }

    protected onActiveItem(event: IActiveItemEvent)
    {
        if (event.previous) {
            this.saveNotes(event.previous);
        }
        else if (event.next) {
            setTimeout(() => {
                this.loadNotes(event.next);
                this.activeNote = this._notes[this._notes.length - 1];
            }, 0);
        }
    }

    protected loadNotes(item: NVItem)
    {
        const url = this.getNoteFileUrl(item);

        fetch(url, { method: "GET" }).then(result => {
            if (result.ok) {
                return result.json();
            }
            else {
                throw new Error(`GET ${url} returned status ${result.status} ${result.statusText}`);
            }
        }).then(json => {
            this._notes = json.notes;
        }).catch(error => {
            console.warn("failed to load notes: %s", error.message);
            this._notes = [];
        });
    }

    protected saveNotes(item: NVItem)
    {
        const json = JSON.stringify({ notes: this._notes });
        const url = this.getNoteFileUrl(item);

        fetch(url, { method: "PUT", body: json }).then(result => {
            if (!result.ok) {
                throw new Error(`PUT ${url} returned status ${result.status} ${result.statusText}`)
            }
        }).catch(error => {
            console.warn("failed to save notes: %s", error.message);
        });
    }

    protected getNoteFileUrl(item: NVItem)
    {
        return item.assetBaseUrl + "-item-notes.json";
    }

    protected emitUpdateEvent()
    {
        this.emit<INotesUpdateEvent>({ type: "notes-update" });
    }
}