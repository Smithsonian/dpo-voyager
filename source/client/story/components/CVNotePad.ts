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

import Component, { types } from "@ff/graph/Component";

import NVItem_old, { INote } from "../../explorer/nodes/NVItem_old";
import CVItemManager from "../../explorer/components/CVItemManager";

////////////////////////////////////////////////////////////////////////////////

export { INote };

export default class CVNotePad extends Component
{
    static readonly typeName: string = "CVNotePad";

    protected static readonly ins = {
        activeItem: types.Object("Scope.ActiveItem", NVItem_old),
    };

    ins = this.addInputs(CVNotePad.ins);

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

    create()
    {
        super.create();
        this.itemManager.outs.activeItem.linkTo(this.ins.activeItem);
    }

    update()
    {
        const ins = this.ins;

        if (ins.activeItem.changed) {
            const item = ins.activeItem.value;
            if (item) {
                this._notes = item.process.get("notes");
                if (!this._notes) {
                    this._notes = [];
                    item.process.set("notes", this._notes);
                }

                this.activeNote = this._notes[this._notes.length - 1];
            }
            else {
                this._notes = [];
                this.activeNote = null;
            }
        }

        return true;
    }
}