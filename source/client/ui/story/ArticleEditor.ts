/**
 * 3D Foundation Project
 * Copyright 2023 Smithsonian Institution
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

/* Import TinyMCE */
import tinymce from 'tinymce';

/* Default icons are required for TinyMCE 5.3 or above */
import 'tinymce/icons/default';

/* A theme is also required */
import 'tinymce/themes/silver';

import 'tinymce/models/dom/model';

/* Import the skin */
import './editor_css/skin.min.css';

/* Import plugins */
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/image';
import 'tinymce/plugins/media';

/* Import content css */
import contentUiCss from '!!raw-loader!./editor_css/content.ui.min.css';
import contentCss from '!!raw-loader!./editor_css/content.min.css';

import Notification from "@ff/ui/Notification";
import MessageBox from "@ff/ui/MessageBox";

import SystemView, { customElement } from "@ff/scene/ui/SystemView";

import CVAssetManager from "../../components/CVAssetManager";
import CVAssetReader from "../../components/CVAssetReader";
import CVAssetWriter from "../../components/CVAssetWriter";

import CVMediaManager, { IAssetOpenEvent, IAssetRenameEvent } from "../../components/CVMediaManager";
import CVStandaloneFileManager from "../../components/CVStandaloneFileManager";
import CVReader from "../../components/CVReader";


////////////////////////////////////////////////////////////////////////////////

@customElement("sv-article-editor")
export default class ArticleEditor extends SystemView
{
    private _container: HTMLDivElement = null;
    private _overlay: HTMLElement = null;
    private _assetPath: string = "";

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
        if (tinymce.activeEditor.isDirty() && this._assetPath) {
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
            tinymce.activeEditor.setDirty(false);
            if(this._overlay.parentElement === this) {
                this.removeChild(this._overlay);
            }
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
                assetUrl = assetUrl.replace(CVMediaManager.articleFolder + "/", '');
                return pre + assetUrl + post;
            }

            return pre + this.assetManager.getRelativeAssetPath(assetUrl, basePath) + post;
        });

        return this.assetWriter.putText(content, this._assetPath)
            .then(() => {
                tinymce.activeEditor.setDirty(false);
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
        tinymce.activeEditor.setDirty(false);

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

        this._overlay = this.appendElement("div");
        this._overlay.classList.add("sv-overlay");

        tinymce.init({
            selector: "#editor_wrapper",
            plugins: "image link lists media",
            toolbar: 'saveButton closeButton | undo redo | link image media | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist | outdent indent | styles',
            menubar: false,
            skin: false,
            height: "100%",
            resize: false,
            branding: false,
            automatic_uploads: true,
            images_reuse_filename: true,
            link_assume_external_targets: 'https',
            paste_as_text: true,
            content_css: false,
            content_style: [contentCss, contentUiCss].join('\n'),
            convert_urls: false,
            image_caption: true,
            link_default_target: '_blank',
            //link_target_list: false,

            images_upload_handler: (file, progress) => new Promise((resolve, reject) => {
                const filename = this.mediaManager.getUniqueName(CVMediaManager.articleFolder + "/" + file.filename());
                this.mediaManager.uploadFile(filename, file.blob(), this.mediaManager.getAssetByPath(CVMediaManager.articleFolder + "/")).
                    then( () => { resolve(this.assetManager.getAssetUrl(CVMediaManager.articleFolder + "/" + filename))});
            }),
            file_picker_callback: (callback, value, meta) =>{
                const mediaManager = this.mediaManager;
                const assetManager = this.assetManager;
                let accept = meta.filetype == "image"?"image/*":"video/*";
                let input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', accept);
                input.onchange = function () {
                    let file = input.files[0];
                    Notification.show("Started file upload", "info");
                    mediaManager.uploadFile(file.name, file, mediaManager.getAssetByPath(CVMediaManager.articleFolder + "/")).
                    then( () => { 
                        callback(assetManager.getAssetUrl(CVMediaManager.articleFolder + "/" + file.name), {title: file.name});
                        Notification.show("File uploaded", "info");
                    });
                };
                input.click();
            },
            init_instance_callback: (editor) => {
                editor.editorUpload.addFilter((img) => {
                    const blobInfo = editor.editorUpload.blobCache.getByUri(img.src);
                    if(blobInfo) {
                        if(this.standaloneFileManager) {
                            const filename = this.mediaManager.getUniqueName(CVMediaManager.articleFolder + "/" + blobInfo.filename());
                            this.mediaManager.uploadFile(filename, blobInfo.blob(), this.mediaManager.getAssetByPath(CVMediaManager.articleFolder + "/"))
                            img.src = this.assetManager.getAssetUrl(CVMediaManager.articleFolder + "/" + filename);
                        }
                        else {
                            return true;
                        }
                    }
                    return false;
                });
            },

            setup: (editor) => {
                editor.ui.registry.addButton('saveButton', {
                    text: 'Save',
                    icon: 'save',
                    onAction: (_) => {
                        this.saveArticle();
                    }
                });

                editor.ui.registry.addButton('closeButton', {
                    text: 'Close',
                    icon: 'close',
                    onAction: (_) => {
                        this.closeArticle();
                    }
                });

                /*editor.on('init', function(args) {
                    editor = args.target;
            
                    editor.on('NodeChange', function(e) {
                        if (e && e.element.nodeName.toLowerCase() == 'img') {
                            tinymce.DOM.setAttribs(e.element, {'height': "100%", 'max-width': "100%"});
                        }
                    });
                });*/
            },
        });       
    }

    protected connected()
    {
        super.connected();
        this.mediaManager.on<IAssetOpenEvent>("asset-open", this.onOpenAsset, this);
        this.mediaManager.on<IAssetRenameEvent>("asset-rename", this.onRenameAsset, this);
    }

    protected disconnected()
    {
        this.mediaManager.off<IAssetRenameEvent>("asset-rename", this.onRenameAsset, this);
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
        // if opened asset is of type text/*, open it in the editor
        else if (event.asset.info.type.startsWith("text/")) {
            this.openArticle(event.asset.info.path);
        }
    }

    protected onRenameAsset(event: IAssetRenameEvent)
    {
        // update asset path
        if(event.oldPath === this._assetPath ) {
            this._assetPath = event.newPath;
        }
    }
}