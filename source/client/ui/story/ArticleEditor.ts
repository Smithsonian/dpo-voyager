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

//import * as QuillEditor from "quill";
//import ImageResize from 'quill-image-resize-module';
/* Import TinyMCE */
import tinymce from 'tinymce';

/* Default icons are required for TinyMCE 5.3 or above */
import 'tinymce/icons/default';

/* A theme is also required */
import 'tinymce/themes/silver';

//import 'tinymce/models/dom/model';

/* Import the skin */
import 'tinymce/skins/ui/oxide/skin.css';

/* Import plugins */
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/code';
import 'tinymce/plugins/emoticons';
import 'tinymce/plugins/emoticons/js/emojis';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/table';
import 'tinymce/plugins/image';
import 'tinymce/plugins/imagetools';

/* Import premium plugins */
/* NOTE: Download separately and add these to /src/plugins */
/* import './plugins/checklist/plugin'; */
/* import './plugins/powerpaste/plugin'; */
/* import './plugins/powerpaste/js/wordimport'; */

/* Import content css */
import contentUiCss from '!!raw-loader!tinymce/skins/ui/oxide/content.min.css';
import contentCss from '!!raw-loader!tinymce/skins/content/default/content.min.css';

//import { Editor } from '@tiptap/core'
//import StarterKit from '@tiptap/starter-kit'
//import Image from '@tiptap/extension-image'

import { html, render } from "@ff/ui/CustomElement";
import Notification from "@ff/ui/Notification";
import MessageBox from "@ff/ui/MessageBox";

import SystemView, { customElement } from "@ff/scene/ui/SystemView";
import AssetTree from "@ff/scene/ui/AssetTree";

import CVAssetManager from "../../components/CVAssetManager";
import CVAssetReader from "../../components/CVAssetReader";
import CVAssetWriter from "../../components/CVAssetWriter";

import CVMediaManager, { IAssetOpenEvent } from "../../components/CVMediaManager";
import CVStandaloneFileManager from "../../components/CVStandaloneFileManager";
import CVReader from "../../components/CVReader";


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
    protected get standaloneFileManager() {
        return this.system.getMainComponent(CVStandaloneFileManager, true);
    }
    protected get articleReader() {
        return this.system.getComponent(CVReader);
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
            //this._editor.root.innerHTML = content;
            tinymce.activeEditor.setContent(content, {format: "raw"});
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

        let content = tinymce.activeEditor.getContent({format: "raw"}); //this._editor.root.innerHTML;

        // transform absolute to article-relative URLs
        content = content.replace(/(src=\")(.*?)(\")/g, (match, pre, assetUrl, post) => {
            if((assetUrl as string).startsWith("blob")) {
                assetUrl = this.standaloneFileManager.blobUrlToFileUrl(assetUrl);
                return pre + assetUrl + post;
            }

            return pre + this.assetManager.getRelativeAssetPath(assetUrl, basePath) + post;
        });

        return this.assetWriter.putText(content, this._assetPath)
            .then(() => {
                this._changed = false;
                this.articleReader.ins.articleId.set();
                new Notification(`Article successfully written to '${this._assetPath}'`, "info");
            })
            .catch(error => {
                new Notification(`Failed to write article to '${this._assetPath}': ${error.message}`, "error");
            });
    }

    protected clearArticle()
    {
        tinymce.activeEditor.setContent("");
        this._assetPath = "";
        this._changed = false;

        this.appendChild(this._overlay);

        return Promise.resolve();
    }

    

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-article-editor");

        this._container = this.appendElement("div");
        this._container.classList.add("sv-container");
        this._container.id = "editor_wrapper"

        tinymce.init({
            selector: "#editor_wrapper",
            plugins: "image link lists",
            toolbar: 'undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist | outdent indent | link image',
            skin: false,
            height: "100%",
            resize: false,
            content_css: false,
            content_style: [contentCss, contentUiCss].join('\n'),
            images_reuse_filename: true,

            /*images_upload_handler: (file, success, failure, progress) => {console.log(JSON.stringify(file));
                //this.standaloneFileManager.addFile(file.uri(), [file.blob()]);console.log(this.standaloneFileManager.getFilePath(file.filename()));
                //return Promise.resolve(this.standaloneFileManager.getFilePath(file.filename()));
                return Promise.resolve("");
            },*/

            init_instance_callback: (editor) => {
                editor.on('dirty', () => this._changed = true);
            }
        });
        tinymce.activeEditor.editorUpload.addFilter((img) => {return false;});
        /*const editor = new Editor({
            element: document.querySelector('.sv-article-editor'),
            extensions: [
                StarterKit,
                Image,
            ],
            content: '<p>Hello World!</p>',
            })*/

        // Hack to override Quill sanitization of blob urls.
        /*var Image = QuillEditor.import('formats/image');
        Image.sanitize = function(url) { return url; }

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
        };*/

        

        this._overlay = this.appendElement("div");
        this._overlay.classList.add("sv-overlay");

        /*this._editor = new (QuillEditor as any)(this._container, options);
        this._editor.on("text-change", () => this._changed = true);
        this._editor.root.addEventListener("drop", this.onEditorDrop.bind(this), true);

        const toolbarElement = this.toolbarElement;
        const editorElement = this.editorElement;
        editorElement.classList.add("sv-article");*/

        //tinymce.activeEditor.container.addEventListener("drop", this.onEditorDrop.bind(this), true);
        tinymce.activeEditor.on("drop", this.onEditorDrop.bind(this));

        const customButtons = html`
            <ff-button transparent icon="save" text="Save" title="Save Article" @click=${e => this.saveArticle()}></ff-button>
            <ff-button transparent icon="close" text="Close" title="Close Editor" @click=${e => this.closeArticle()}></ff-button>
        `;

        const container = document.createElement("span");
        container.classList.add("ql-formats", "sv-custom-buttons");
        this.insertBefore(container, this.firstChild);
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
                /*setTimeout(() => {
                    let selection = this._editor.getSelection();

                    if(selection.length === 0) {
                        this._editor.setSelection(selection.index - assetPath.length, assetPath.length);
                        selection = this._editor.getSelection();
                    }

                    if (selection) {
                        // replace text with image asset
                        this._editor.deleteText(selection.index, selection.length);
                        this._editor.insertEmbed(selection.index, "image", assetUrl);
                    }
                });*/

                setTimeout(() => {
                    tinymce.activeEditor.selection.setContent('<img src="' + assetUrl + '"/>');
                });
            }
        }
    }
}