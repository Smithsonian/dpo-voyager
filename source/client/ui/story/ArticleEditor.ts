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

import * as QuillEditor from "quill";
import ImageResize from 'quill-image-resize-module';

import { html, render } from "@ff/ui/CustomElement";

import CAssetManager from "@ff/scene/components/CAssetManager";

import SystemView, { customElement } from "@ff/scene/ui/SystemView";
import AssetTree from "@ff/scene/ui/AssetTree";

import CVAssetReader from "../../components/CVAssetReader";
import CVAssetWriter from "../../components/CVAssetWriter";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-article-editor")
export default class ArticleEditor extends SystemView
{
    protected container: HTMLDivElement = null;
    protected editor = null;
    protected assetPath: string = "";

    protected get assetManager() {
        return this.system.getMainComponent(CAssetManager);
    }
    protected get assetReader() {
        return this.system.getMainComponent(CVAssetReader);
    }
    protected get assetWriter() {
        return this.system.getMainComponent(CVAssetWriter);
    }

    openArticle(assetPath: string)
    {
        this.assetReader.getText(assetPath).then(content => {
            this.editor.root.innerHTML = content.replace(/[\n\r]/g, "");
            this.assetPath = assetPath;
        });
    }

    saveArticle(assetPath?: string)
    {
        if (assetPath) {
            this.assetPath = assetPath;
        }

        this.assetWriter.putText(this.editor.root.innerHTML, this.assetPath);
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-article-editor");

        const toolbarOptions = [
            // header formats
            [{ "header": [1, 2, 3, 4, 5, 6, false] }],

            // toggle buttons
            [ "bold", "italic" ],
            [{ "script": "sub"}, { "script": "super" }],
            [ "blockquote", "code-block" ],

            // text alignment
            [{ "align": "" }, { "align": "center" }, { "align": "right" }],

            // lists, indent
            [{ "list": "ordered"}, { "list": "bullet" }],
            [{ "indent": "-1"}, { "indent": "+1" }],

            // remove formatting
            ["clean"],

                // links, media
            ["link", "image", "video"],
        ];

        const options = {
            //debug: "info",
            modules: {
                toolbar: toolbarOptions,
                imageResize: ImageResize,
            },
            theme: "snow",
            placeholder: "Write, because you have something to say."
        };

        this.container = this.appendElement("div");
        this.editor = new (QuillEditor as any)(this.container, options);
        this.editor.root.addEventListener("drop", this.onEditorDrop.bind(this), true);

        const toolbarElement = this.getElementsByClassName("ql-toolbar").item(0) as HTMLDivElement;
        const editorElement = this.getElementsByClassName("ql-editor").item(0) as HTMLDivElement;
        editorElement.classList.add("sv-article");

        const customButtons = html`
            <ff-button transparent icon="save" title="Save Article" @click=${e => this.saveArticle()}></ff-button>
        `;

        const container = document.createElement("span");
        container.classList.add("ql-formats");
        toolbarElement.insertBefore(container, toolbarElement.firstChild);
        render(customButtons, container);
    }

    protected onEditorDrop(event: DragEvent)
    {
        const assetPath = event.dataTransfer.getData(AssetTree.dragDropMimeType);
        const asset = assetPath && this.assetManager.getAssetByPath(assetPath);

        if (asset) {
            const mimeType = asset.info.type;
            if (mimeType === "image/jpeg" || mimeType === "image/png") {
                const url = this.assetReader.getAssetURL(assetPath);

                // wait until text has been dropped, so we can get a valid selection index
                setTimeout(() => {
                    const selection = this.editor.getSelection();
                    if (selection) {
                        this.editor.deleteText(selection.index, selection.length);
                        this.editor.insertEmbed(selection.index, "image", url);
                    }
                });
            }
        }
    }
}