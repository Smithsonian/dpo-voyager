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

import download from "@ff/browser/download";
import { downloadZip } from "client-zip";

import Component, { Node, types } from "@ff/graph/Component";

import Notification from "@ff/ui/Notification";
import MessageBox from "@ff/ui/MessageBox";

import CVAssetManager from "./CVAssetManager";
import CVAssetReader from "./CVAssetReader";
import CVAssetWriter, { WriteConflictError } from "./CVAssetWriter";
import CVTaskProvider from "./CVTaskProvider";
import CVDocumentProvider from "./CVDocumentProvider";
import CVDocument, { INodeComponents } from "./CVDocument";

import { ETaskMode } from "../applications/taskSets";

import CVLanguageManager from "./CVLanguageManager";
import CVMediaManager from "./CVMediaManager";
import CVMeta from "./CVMeta";
import CVStandaloneFileManager from "./CVStandaloneFileManager";

////////////////////////////////////////////////////////////////////////////////


export default class CVStoryApplication extends Component
{
    static readonly typeName: string = "CVStoryApplication";
    static readonly isSystemSingleton = true;

    protected static readonly ins = {
        exit: types.Event("Application.Exit"),
        save: types.Event("Document.Save"),
        download: types.Event("Document.Download"),
    };

    ins = this.addInputs(CVStoryApplication.ins);

    referrer: string = "";
    dragdrop: boolean = false;

    protected get taskProvider() {
        return this.getMainComponent(CVTaskProvider);
    }
    protected get documentProvider() {
        return this.getMainComponent(CVDocumentProvider);
    }
    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }
    protected get assetReader() {
        return this.getMainComponent(CVAssetReader);
    }
    protected get assetWriter() {
        return this.getMainComponent(CVAssetWriter);
    }
    protected get language() {
        return this.system.getComponent(CVLanguageManager);
    }
    protected get mediaManager() {
        return this.system.getMainComponent(CVMediaManager);
    }
    protected get meta() {
        return this.system.getComponent(CVMeta);
    }
    protected get standaloneFileManager() {
        return this.system.getComponent(CVStandaloneFileManager, true);
    }

    constructor(node: Node, id: string)
    {
        super(node, id);
        this.beforeUnload = this.beforeUnload.bind(this);
    }

    create()
    {
        super.create();
        window.addEventListener("beforeunload", this.beforeUnload);
    }

    dispose()
    {
        window.removeEventListener("beforeunload", this.beforeUnload);
        super.dispose();
    }

    update()
    {
        const ins = this.ins;

        if (ins.exit.changed && this.referrer) {
            location.assign(this.referrer);
        }

        const cvDocument = this.documentProvider.activeComponent;

        if (cvDocument) {
            const storyMode = this.taskProvider.ins.mode.getValidatedValue();
            let components: INodeComponents = null;
            if (storyMode === ETaskMode.QC && (ins.save.changed || ins.download.changed)) {
                components = { model: true };
                Notification.show("Running in QC Mode: Saving model only, but no scene data.", "warning", 5000);
            }

            if (ins.save.changed) {
                const data = cvDocument.deflateDocument(components);
                const json = JSON.stringify(data, (key, value) =>
                    typeof value === "number" ? parseFloat(value.toFixed(7)) : value);

                if(storyMode !== ETaskMode.Standalone) {
                    this.assetWriter.putJSON(json, cvDocument.assetPath)
                    .then(response => this.onDocumentSaved(response, cvDocument))
                    .catch(error => this.onDocumentSaveFailed(error, cvDocument, json));
                }
                else {
                    // Standalone save
                    const fileManager : CVStandaloneFileManager = this.standaloneFileManager;
                    const saveFiles = [];

                    const fileName = this.assetManager.getAssetName(cvDocument.assetPath);
                    saveFiles.push({ name: fileName, lastModified: new Date(), input: json });

                    const files = fileManager.getFiles().filter(file => file != null && !file.name.endsWith(".json"));
                    files.forEach(file => {
                        saveFiles.push({ name: fileManager.getFilePath(file.name)+file.name, lastModified: new Date(), input: file });
                    });
               
                    downloadZip(saveFiles).blob().then(blob => { // await for async
                        const bloburl = URL.createObjectURL(blob);
                        download.url(bloburl, "voyager-scene.zip");
                    });
                }
            }

            if (ins.download.changed) {
                const data = cvDocument.deflateDocument(components);
                const json = JSON.stringify(data, null, 2);

                const fileName = this.assetManager.getAssetName(cvDocument.assetPath);
                download.json(json, fileName);
            }
        }


        return false;
    }

    /**
     * Reports what the server did with a document we just saved. `205 Reset Content` means what
     * is stored is our changes combined with somebody else's, so the scene on screen is stale.
     */
    protected onDocumentSaved(response: Response, cvDocument: CVDocument): Promise<void>
    {
        const assetPath = cvDocument.assetPath;

        if (response.status !== 205) {
            new Notification(this.language.getUILocalizedString({ text: "Successfully uploaded file to '{0}'", args: [assetPath] }), "info", 4000);
            return Promise.resolve();
        }

        return MessageBox.show(this.language.getUILocalizedString("Scene merged"),
            this.language.getUILocalizedString({
                key: "save.merged",
                text: "Somebody else changed '{0}' while you were editing it. Load the merged version now?",
                args: [assetPath],
            }),
            "warning", "yes-no")
        .then(result => {
            if (!result.ok) {
                new Notification(this.language.getUILocalizedString({ text: "Kept your version of '{0}'.", args: [assetPath] }), "warning", 8000);
                return;
            }

            return this.reloadDocument(cvDocument)
            .then(() => { new Notification(this.language.getUILocalizedString({ text: "Loaded the merged version of '{0}'", args: [assetPath] }), "info", 4000); })
            .catch(() => { new Notification(this.language.getUILocalizedString({ text: "Failed to reload '{0}'", args: [assetPath] }), "error", 8000); });
        });
    }

    /**
     * Reports a save that did not happen. A {@link WriteConflictError} means nothing was stored
     * and the only copy of the change is the one on screen.
     */
    protected onDocumentSaveFailed(error: Error, cvDocument: CVDocument, json: string): Promise<void>
    {
        const assetPath = cvDocument.assetPath;

        if (!(error instanceof WriteConflictError)) {
            new Notification(this.language.getUILocalizedString({ text: "Failed to upload file to '{0}'", args: [assetPath] }), "error", 8000);
            return Promise.resolve();
        }

        return MessageBox.show(this.language.getUILocalizedString("Save refused"),
            this.language.getUILocalizedString({
                key: "save.refused",
                text: "Somebody else changed '{0}' since you opened it, so nothing was saved. "
                    + "Save your version over theirs?",
                args: [assetPath],
            }),
            "warning", "yes-no")
        .then(result => {
            if (!result.ok) {
                new Notification(this.language.getUILocalizedString({ text: "'{0}' was not saved.", args: [assetPath] }), "warning", 8000);
                return;
            }

            this.assetWriter.forgetRevision(assetPath);
            return this.assetWriter.putJSON(json, assetPath)
            .then(response => this.onDocumentSaved(response, cvDocument))
            .catch(() => { new Notification(this.language.getUILocalizedString({ text: "Failed to upload file to '{0}'", args: [assetPath] }), "error", 8000); });
        });
    }

    /** Replaces the active document with the one on the server, rebuilding the whole node tree. */
    protected reloadDocument(cvDocument: CVDocument): Promise<CVDocument>
    {
        const assetPath = cvDocument.assetPath;

        return this.assetReader.getJSON(assetPath)
        .then(data => this.documentProvider.amendDocument(data, assetPath, false));
    }

    /**
     * Provoke a user prompt before unloading the page
     * @param event
     */
    protected beforeUnload(event)
    {
        event.returnValue = "x";
        //return "x";
    }
}