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

import * as QuillEditor from "quill";
import ImageResize from 'quill-image-resize-module';

import { html, render } from "@ff/ui/CustomElement";
import Notification from "@ff/ui/Notification";
import MessageBox from "@ff/ui/MessageBox";

import SystemView, { customElement } from "@ff/scene/ui/SystemView";
import AssetTree from "@ff/scene/ui/AssetTree";

import CVAssetManager from "../../components/CVAssetManager";
import CVAssetReader from "../../components/CVAssetReader";
import CVAssetWriter from "../../components/CVAssetWriter";

import CVMediaManager, { IAssetOpenEvent } from "../../components/CVMediaManager";


////////////////////////////////////////////////////////////////////////////////

@customElement("sv-article-editor")
export default class ArticleEditor extends SystemView
{
    private _container: HTMLDivElement = null;
    private _overlay: HTMLElement = null;
    private _editor = null;
    private _assetPath: string = "";
    private _changed = false;

    protected get mediaManager() {
        return this.system.getMainComponent(CVMediaManager);
    }
    protected get assetManager() {
        return this.system.getMainComponent(CVAssetManager);
    }
    protected get assetReader() {
        return this.system.getMainComponent(CVAssetReader);
    }
    protected get assetWriter() {
        return this.system.getMainComponent(CVAssetWriter);
    }

    protected get editorElement() {
        return this.getElementsByClassName("ql-editor").item(0) as HTMLDivElement;
    }
    protected get toolbarElement() {
        return this.getElementsByClassName("ql-toolbar").item(0) as HTMLDivElement;
    }

    openArticle(assetPath: string)
    {
        if (this._assetPath) {
            return this.closeArticle().then(() => this.readArticle(assetPath));
        }

        return this.readArticle(assetPath);
    }

    saveArticle()
    {
        if (this._assetPath) {
            this.writeArticle();
        }
    }

    closeArticle()
    {
        if (this._changed && this._assetPath) {
            return MessageBox.show("Close Article", "Would you like save your changes?", "warning", "yes-no").then(result => {
                if (result.ok) {
                    return this.writeArticle().then(() => this.clearArticle());
                }
                else {
                    return this.clearArticle();
                }
            });
        }

        return this.clearArticle();
    }

    protected readArticle(assetPath: string)
    {
        return this.assetReader.getText(assetPath)
        .then(content => this.parseArticle(content, assetPath))
        .then(content => {
            this._editor.root.innerHTML = content;
            this._assetPath = assetPath;
        }).then(() => {
            this._changed = false;
            this.removeChild(this._overlay);
        });
    }

    protected parseArticle(content: string, articlePath: string): Promise<string>
    {
        // remove line breaks
        content = content.replace(/[\n\r]/g, "");

        // transform article-relative to absolute URLs
        const articleBasePath = this.assetManager.getAssetBasePath(articlePath);

        content = content.replace(/(src=\")(.*?)(\")/g, (match, pre, assetUrl, post) => {
            if (!assetUrl.startsWith("/") && !assetUrl.startsWith("http")) {
                assetUrl = this.assetManager.getAssetUrl(articleBasePath + assetUrl);
            }
            return pre + assetUrl + post;
        });

        return Promise.resolve(content);
    }

    protected writeArticle()
    {
        const basePath = this.assetManager.getAssetBasePath(this._assetPath);

        let content = this._editor.root.innerHTML;

        // transform absolute to article-relative URLs
        content = content.replace(/(src=\")(.*?)(\")/g, (match, pre, assetUrl, post) => {
            return pre + this.assetManager.getRelativeAssetPath(assetUrl, basePath) + post;
        });

        return this.assetWriter.putText(content, this._assetPath)
            .then(() => {
                this._changed = false;
                new Notification(`Article successfully written to '${this._assetPath}'`, "info");
            })
            .catch(error => {
                new Notification(`Failed to write article to '${this._assetPath}': ${error.message}`, "error");
            });
    }

    protected clearArticle()
    {
        this._editor.root.innerHTML = "";
        this._assetPath = "";
        this._changed = false;

        this.appendChild(this._overlay);

        return Promise.resolve();
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
            //["link", "image", "video"],
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

        this._container = this.appendElement("div");
        this._container.classList.add("sv-container");

        this._overlay = this.appendElement("div");
        this._overlay.classList.add("sv-overlay");

        this._editor = new (QuillEditor as any)(this._container, options);
        this._editor.on("text-change", () => this._changed = true);
        this._editor.root.addEventListener("drop", this.onEditorDrop.bind(this), true);

        const toolbarElement = this.toolbarElement;
        const editorElement = this.editorElement;
        editorElement.classList.add("sv-article");

        const customButtons = html`
            <ff-button transparent icon="save" text="Save" title="Save Article" @click=${e => this.saveArticle()}></ff-button>
            <ff-button transparent icon="close" text="Close" title="Close Editor" @click=${e => this.closeArticle()}></ff-button>
        `;

        const container = document.createElement("span");
        container.classList.add("ql-formats", "sv-custom-buttons");
        toolbarElement.insertBefore(container, toolbarElement.firstChild);
        render(customButtons, container);
    }

    protected connected()
    {
        super.connected();
        this.mediaManager.on<IAssetOpenEvent>("asset-open", this.onOpenAsset, this);
    }

    protected disconnected()
    {
        this.mediaManager.off<IAssetOpenEvent>("asset-open", this.onOpenAsset, this);
        super.disconnected();
    }

    protected onOpenAsset(event: IAssetOpenEvent)
    {
        // if there is no asset, close any current article
        if(event.asset === null ) {
            if(this._assetPath) {
                this.closeArticle();
            }
        }
        // if opened asset is of type text/html, open it in the editor
        else if (event.asset.info.type.startsWith("text/html")) {
            this.openArticle(event.asset.info.path);
        }
    }

    protected onEditorDrop(event: DragEvent)
    {
        // get the dropped asset path and then the asset from the media manager
        const assetPath = event.dataTransfer.getData(AssetTree.dragDropMimeType);
        const asset = assetPath && this.mediaManager.getAssetByPath(assetPath);

        if (asset) {
            // only jpeg and png images can be dropped
            const mimeType = asset.info.type;
            if (mimeType === "image/jpeg" || mimeType === "image/png") {
                const assetUrl = this.assetManager.getAssetUrl(assetPath);
                // wait until text has been dropped, so we can get a valid selection index
                setTimeout(() => {
                    const selection = this._editor.getSelection();
                    if (selection) {
                        // replace text with image asset
                        this._editor.deleteText(selection.index, selection.length);
                        this._editor.insertEmbed(selection.index, "image", assetUrl);
                    }
                });
            }
        }
    }
}