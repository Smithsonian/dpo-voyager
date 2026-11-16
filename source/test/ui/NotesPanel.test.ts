import { expect } from "chai";

import NotesPanel from "client/ui/story/NotesPanel";
import { INote } from "client/schema/meta";

// Built from local time, so the expected string holds in any timezone
const created = new Date(2024, 0, 2, 3, 4, 5, 678);
const note: INote = { date: created.toISOString(), user: "jdoe", text: "hello" };
const expected = "2024-01-02 03:04:05";

describe("NotesPanel", function(){
  it("shows a note's date in local time in the table", function(){
    const [dateColumn] = NotesPanel["tableColumns"];
    expect((dateColumn.cell as (row: INote) => string)(note)).to.equal(expected);
  });

  it("shows a note's date in local time in the detail view", function(){
    const panel = {
      activeDocument: { setup: { language: { getUILocalizedString: (s: string) => s } } },
    };
    const result = NotesPanel.prototype["renderNote"].call(panel, note);
    expect(result.values).to.include(expected);
  });
});
