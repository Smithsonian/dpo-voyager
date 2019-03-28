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

import { Quill, QuillOptionsStatic } from "quill";
import * as QuillEditor from "quill";

import SystemView, { customElement } from "@ff/scene/ui/SystemView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-editor-panel")
export default class EditorPanel extends SystemView
{
    protected editor: Quill = null;
    protected editorElement: HTMLDivElement = null;


    protected firstConnected()
    {
        this.classList.add("sv-panel", "sv-editor-panel");

        this.editorElement = this.appendElement("div");

        const toolbarOptions = [
            // toggle buttons
            [ "bold", "italic", "underline", "strike" ],
            [{ "script": "sub"}, { "script": "super" }],
            [ "blockquote", "code-block" ],

            // text alignment
            [{ "align": "" }, { "align": "center" }, { "align": "right" }, { "align": "justify" }],

            // lists, indent
            [{ "list": "ordered"}, { "list": "bullet" }],
            [{ "indent": "-1"}, { "indent": "+1" }],

            // header formats
            [{ "header": 1 }, { "header": 2 }],
            [{ "header": [1, 2, 3, 4, 5, 6, false] }],

            // links, media, remove formatting
            ["link", "image", "video"],
            ["clean"]
        ];

        const options: QuillOptionsStatic = {
            //debug: "info",
            modules: {
                toolbar: toolbarOptions
            },
            theme: "snow"
        };

        this.editor = new (QuillEditor as any)(this.editorElement, options);
        this.editor.getContents();
    }
}