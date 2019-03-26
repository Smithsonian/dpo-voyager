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

import CVNodeObserver from "../../explorer/components/CVNodeObserver";
import NVNode from "../../explorer/nodes/NVNode";
import CVInfo from "../../explorer/components/CVInfo";

////////////////////////////////////////////////////////////////////////////////

export interface INote
{
    date: string;
    user: string;
    text: string;
}

export default class CVNotePad extends CVNodeObserver
{
    static readonly typeName: string = "CVNotePad";

    info: CVInfo = null;

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
            this.emit("update");
        }
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
            this.emit("update");
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

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        const info = this.info = next && next.info;

        if (info) {
            this._notes = info.meta.get("notes");
            if (!this._notes) {
                this._notes = [];
                info.meta.insert(this._notes, "notes");
            }

            this.activeNote = this._notes[this._notes.length - 1];
        }
        else {
            this._notes = [];
            this.activeNote = null;
        }
    }
}