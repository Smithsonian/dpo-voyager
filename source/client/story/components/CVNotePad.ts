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

import { INote } from "../../explorer/nodes/NVItem";
import CVItemManager, { IActiveItemEvent } from "../../explorer/components/CVItemManager";

////////////////////////////////////////////////////////////////////////////////

export { INote };

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

    setNote(user: string, text: string)
    {
        if (this.activeNote) {
            this.activeNote.user = user;
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
            event.previous.process.set("notes", this._notes.slice());
        }
        else if (event.next) {
            setTimeout(() => {
                this._notes = event.next.process.get("notes") || [];
                this.activeNote = this._notes[this._notes.length - 1];
            }, 0);
        }
    }

    protected emitUpdateEvent()
    {
        this.emit<INotesUpdateEvent>({ type: "notes-update" });
    }
}