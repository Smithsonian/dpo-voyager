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

import download from "@ff/browser/download";
import { downloadZip } from "client-zip";

import Component, { Node, types } from "@ff/graph/Component";

import Notification from "@ff/ui/Notification";

import CVAssetManager from "./CVAssetManager";
import CVAssetWriter from "./CVAssetWriter";
import CVTaskProvider from "./CVTaskProvider";
import CVDocumentProvider from "./CVDocumentProvider";
import { INodeComponents } from "./CVDocument";

import { ETaskMode } from "../applications/taskSets";

import { EDerivativeQuality, EAssetType } from "client/schema/model";
import CVMediaManager from "./CVMediaManager";
import { IAssetEntry } from "client/../../libs/ff-scene/source/components/CAssetManager";
import CVModel2 from "./CVModel2";
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

    protected get taskProvider() {
        return this.getMainComponent(CVTaskProvider);
    }
    protected get documentProvider() {
        return this.getMainComponent(CVDocumentProvider);
    }
    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }
    protected get assetWriter() {
        return this.getMainComponent(CVAssetWriter);
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
            // in QC mode, only save the model, but no scene data, in all other modes, save everything
            const storyMode = this.taskProvider.ins.mode.getValidatedValue();
            const components: INodeComponents = storyMode === ETaskMode.QC ? { model: true } : null;

            if (ins.save.changed) {
                const data = cvDocument.deflateDocument(components);
                const json = JSON.stringify(data, (key, value) =>
                    typeof value === "number" ? parseFloat(value.toFixed(7)) : value);

                if(storyMode !== ETaskMode.Standalone) {
                    this.assetWriter.putJSON(json, cvDocument.assetPath)
                    .then(() => new Notification(`Successfully uploaded file to '${cvDocument.assetPath}'`, "info", 4000))
                    .catch(e => new Notification(`Failed to upload file to '${cvDocument.assetPath}'`, "error", 8000));
                }
                else {
                    // Standalone save
                    const fileManager = this.standaloneFileManager;
                    const saveFiles = [];

                    const fileName = this.assetManager.getAssetName(cvDocument.assetPath);
                    saveFiles.push({ name: fileName, lastModified: new Date(), input: json });

                    // collect model files
                    const models = this.getSystemComponents(CVModel2);
                    models.forEach(model => {
                        model.derivatives.getArray().forEach(derivative => {
                            const modelAsset = derivative.findAsset(EAssetType.Model);
                            if(modelAsset !== undefined) {
                                const modelFile = fileManager.getFile(modelAsset.data.uri);
                                if(modelFile !== undefined) {
                                    saveFiles.push({ name: modelFile.name, lastModified: new Date(), input: modelFile });
                                }
                            }
                        });
                    });

                    // collect thumbnail images              
                    const meta = this.meta;
                    const images = meta && meta.images;

                    if (images && images.length > 0) {
                        images.items.forEach(image => {
                            saveFiles.push({ name: image.uri, lastModified: new Date(), input: fileManager.getFile(image.uri) });
                        });
                    }

                    // recursively collect articles and related assets
                    const assetURIs = this.getArticleAssetURIs(this.mediaManager.root);
                    assetURIs.filter(uri => uri.split("/").length > 1).forEach(uri => {
                        saveFiles.push({ name: uri, lastModified: new Date(), input: fileManager.getFile(uri) });
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
     * Provoke a user prompt before unloading the page
     * @param event
     */
    protected beforeUnload(event)
    {
        event.returnValue = "x";
        //return "x";
    }

    protected getArticleAssetURIs(asset: IAssetEntry): string[] 
    {
        let result: string[] = [];

        if(asset.info.folder) {
            asset.children.forEach(child => {
                if(!child.info.folder) {
                    result.push(child.info.url);
                }
                else {
                    result = result.concat(this.getArticleAssetURIs(child));
                }
            });
        }
        else {
            result.push(asset.info.url);
        }

        return result;
    }
}