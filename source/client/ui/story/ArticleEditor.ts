/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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
import contentUiCss from './editor_css/content.ui.min.css?raw';
import contentCss from './editor_css/content.min.css?raw';
import contentOverrides from './editor_css/overrides.css?raw';

import Notification from "@ff/ui/Notification";
import MessageBox from "@ff/ui/MessageBox";

import { render } from "@ff/ui/CustomElement";
import SystemView, { customElement, html } from "@ff/scene/ui/SystemView";

import CVAssetManager from "../../components/CVAssetManager";
import CVAssetReader from "../../components/CVAssetReader";
import CVAssetWriter from "../../components/CVAssetWriter";

import CVMediaManager, { IAssetMissingEvent, IAssetOpenEvent, IAssetRenameEvent } from "../../components/CVMediaManager";
import CVStandaloneFileManager from "../../components/CVStandaloneFileManager";
import CVArticlesTask from "../../components/CVArticlesTask";
import { HTTPError } from "../../utils/errors";
import "../Spinner";
import CVReader from "../../components/CVReader";


////////////////////////////////////////////////////////////////////////////////

export interface IOverlayAction
{
    text: string;
    icon?: string;
    onClick: () => void;
}

/**
 * What the editor shows. Every state except "ready" covers the editor with an overlay:
 * - closed: no article open
 * - loading: a spinner and a message
 * - error: a message, details and actions (retry, create...)
 */
export type EditorStatus =
    | { state: "closed" }
    | { state: "loading", message: string }
    | { state: "error", message: string, details?: string, actions?: IOverlayAction[] }
    | { state: "ready" };

@customElement("sv-article-editor")
export default class ArticleEditor extends SystemView
{
    private _container: HTMLDivElement = null;
    private _overlay: HTMLElement = null;
    /** Path of the article open in the editor, only set once it has been read */
    private _assetPath: string = "";
    /** Path of the article being read; a response for any other path is outdated and ignored */
    private _loadingPath: string = "";
    private _status: EditorStatus = { state: "closed" };

    get status(): EditorStatus {
        return this._status;
    }

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
    protected get articlesTask() {
        return this.system.getComponent(CVArticlesTask, true);
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
        this._loadingPath = assetPath;
        this.setStatus({ state: "loading", message: "Loading article..." });

        return this.assetReader.getText(assetPath)
        .then(content => this.parseArticle(content, assetPath))
        .then(content => {
            if (this._loadingPath !== assetPath) {
                return;
            }
            this._loadingPath = "";
            tinymce.activeEditor.setContent(content, {format: "raw"});
            tinymce.activeEditor.setDirty(false);
            this._assetPath = assetPath;
            this.setStatus({ state: "ready" });
        }, error => {
            if (this._loadingPath !== assetPath) {
                return;
            }
            this._loadingPath = "";
            console.warn("Failed to read article '%s':", assetPath, error);
            this.setStatus(this.getReadErrorStatus(assetPath, error));
        });
    }

    protected getReadErrorStatus(assetPath: string, error: Error): EditorStatus
    {
        if (error instanceof HTTPError && error.status === 404) {
            // Create the file through the articles task, as it does for a language without a file
            const task = this.articlesTask;
            const canCreate = task && task.outs.isActive.value && task.activeArticle?.uri === assetPath;

            return {
                state: "error",
                message: `Article not found: '${assetPath}'`,
                actions: canCreate ? [{ text: "Create Article", icon: "create", onClick: () => task.ins.version.set() }] : [],
            };
        }

        return {
            state: "error",
            message: `Failed to load article '${assetPath}'`,
            details: error.message,
            actions: [{ text: "Retry", onClick: () => this.openArticle(assetPath) }],
        };
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
        this._loadingPath = "";
        if (this._assetPath) {
            tinymce.activeEditor.setContent("");
            tinymce.activeEditor.setDirty(false);
            this._assetPath = "";
        }

        this.setStatus({ state: "closed" });

        return Promise.resolve();
    }

    protected setStatus(status: EditorStatus)
    {
        this._status = status;

        if (status.state === "ready") {
            if (this._overlay.parentElement === this) {
                this.removeChild(this._overlay);
            }
            return;
        }

        if (this._overlay.parentElement !== this) {
            this.appendChild(this._overlay);
        }
        render(this.renderOverlay(status), this._overlay);
    }

    protected renderOverlay(status: EditorStatus)
    {
        switch (status.state) {
            case "loading":
                return html`<sv-spinner visible .assetPath=${this.assetReader.getSystemAssetUrl("")}></sv-spinner>
                    <div class="sv-overlay-message">${status.message}</div>`;
            case "error":
                return html`<div class="sv-overlay-message sv-error">${status.message}</div>
                    ${status.details ? html`<div class="sv-overlay-details">${status.details}</div>` : null}
                    <div class="sv-overlay-actions">${(status.actions ?? []).map(action => html`<ff-button
                        text=${action.text} icon=${action.icon ?? ""} @click=${action.onClick}></ff-button>`)}</div>`;
            default:
                return html``;
        }
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
    }

    protected connected()
    {
        super.connected();
        this.mediaManager.on<IAssetOpenEvent>("asset-open", this.onOpenAsset, this);
        this.mediaManager.on<IAssetRenameEvent>("asset-rename", this.onRenameAsset, this);
        this.mediaManager.on<IAssetMissingEvent>("asset-missing", this.onMissingAsset, this);

        this._container.id = "editor_wrapper"

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
            font_css: this.assetReader.getSystemAssetUrl("fonts/fonts.css"),
            content_style: [contentCss, contentUiCss, contentOverrides].join('\n'),
            convert_urls: false,
            image_caption: true,
            link_default_target: '_blank',
            //link_target_list: false,

            images_upload_handler: (file, progress) => new Promise((resolve, reject) => {
                const filename = this.mediaManager.getUniqueName(CVMediaManager.articleFolder + "/" + file.filename());
                const fullPath = CVMediaManager.articleFolder + "/" + filename;
                this.mediaManager.uploadFile(fullPath, file.blob()).
                    then( () => { resolve(this.assetManager.getAssetUrl(fullPath))});
            }),

            init_instance_callback: (editor) => {
                editor.editorUpload.addFilter((img) => {
                    const blobInfo = editor.editorUpload.blobCache.getByUri(img.src);
                    if(blobInfo) {
                        if(this.standaloneFileManager) {
                            const filename = this.mediaManager.getUniqueName(CVMediaManager.articleFolder + "/" + blobInfo.filename());
                            const fullPath = CVMediaManager.articleFolder + "/" + filename;
                            this.mediaManager.uploadFile(fullPath, blobInfo.blob())
                            img.src = this.assetManager.getAssetUrl(fullPath);
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

    protected disconnected()
    {
        this.mediaManager.off<IAssetMissingEvent>("asset-missing", this.onMissingAsset, this);
        this.mediaManager.off<IAssetRenameEvent>("asset-rename", this.onRenameAsset, this);
        this.mediaManager.off<IAssetOpenEvent>("asset-open", this.onOpenAsset, this);

        tinymce.activeEditor.remove();
        super.disconnected();
    }

    protected onOpenAsset(event: IAssetOpenEvent)
    {
        // if there is no asset, close any current article
        if(event.asset === null ) {
            if(this._status.state !== "closed") {
                this.closeArticle();
            }
        }
        // if opened asset is of type text/*, open it in the editor
        else if (event.asset.info.type.startsWith("text/")) {
            this.openArticle(event.asset.info.path);
        }
    }

    protected onMissingAsset(event: IAssetMissingEvent)
    {
        // Read it anyway: the listing may be out of date, and a 404 shows the "Create Article" action
        this.openArticle(event.path);
    }

    protected onRenameAsset(event: IAssetRenameEvent)
    {
        // update asset path
        if(event.oldPath === this._assetPath ) {
            this._assetPath = event.newPath;
        }
    }
}