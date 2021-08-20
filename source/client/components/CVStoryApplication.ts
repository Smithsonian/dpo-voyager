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

import Component, { Node, types } from "@ff/graph/Component";

import Notification from "@ff/ui/Notification";

import CVAssetManager from "./CVAssetManager";
import CVAssetWriter from "./CVAssetWriter";
import CVTaskProvider from "./CVTaskProvider";
import CVDocumentProvider from "./CVDocumentProvider";
import { INodeComponents } from "./CVDocument";

import { ETaskMode } from "../applications/taskSets";

import { SimpleDropzone } from 'simple-dropzone';
import CVAssetReader from "./CVAssetReader";
import { EDerivativeQuality } from "client/schema/model";
import ExplorerApplication from "client/applications/ExplorerApplication";
import MainView from "client/ui/story/MainView";

////////////////////////////////////////////////////////////////////////////////


export default class CVStoryApplication extends Component
{
    static readonly typeName: string = "CVStoryApplication";
    static readonly isSystemSingleton = true;

    private configuredStandalone: boolean = false;
    private runtimeURLs: Array<string> = [];

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

    constructor(node: Node, id: string)
    {
        super(node, id);
        this.beforeUnload = this.beforeUnload.bind(this);
    }

    create()
    {
        super.create();
        window.addEventListener("beforeunload", this.beforeUnload);
        this.assetManager.outs.completed.on("value", this.cleanupFiles, this);
    }

    dispose()
    {
        this.assetManager.outs.completed.off("value", this.cleanupFiles, this);
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

                this.assetWriter.putJSON(json, cvDocument.assetPath)
                .then(() => new Notification(`Successfully uploaded file to '${cvDocument.assetPath}'`, "info", 4000))
                .catch(e => new Notification(`Failed to upload file to '${cvDocument.assetPath}'`, "error", 8000));
            }

            if (ins.download.changed) {
                const data = cvDocument.deflateDocument(components);
                const json = JSON.stringify(data, null, 2);

                const fileName = this.assetManager.getAssetName(cvDocument.assetPath);
                download.json(json, fileName);
            }

            
            if (!this.configuredStandalone) {
                const explorerPanel = document.getElementsByClassName('sv-explorer-panel')[0];
                const input = document.querySelector('#fileInput');
                const dropZone = new SimpleDropzone(explorerPanel, input);
                dropZone.on('drop', ({files}: any) => this.onFileDrop(files));
                this.configuredStandalone = true;
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

    
    protected onFileDrop(files: Map<string, File>)
    {
        console.log("FILES DROPPED");
        console.log(files);

        const fileArray = Array.from(files);

        const docIndex = fileArray.findIndex( (element) => { return element[0].toLowerCase().indexOf(".svx.json") > -1 });
        const documentProvided : boolean = docIndex > -1;
        if(documentProvided) {
            fileArray.push(fileArray.splice(docIndex)[0]);
        }
        

        fileArray.forEach(([path, file]) => {
            const filename = file.name.toLowerCase();
            if (filename.match(/\.(gltf|glb|svx.json)$/)) {
                console.log("GLTF DROPPED");
                console.log(path);

                const rootPath = path.replace(file.name, '');

                this.assetManager.loadingManager.setURLModifier( ( url ) => {

                    const index = url.lastIndexOf('/');

                    const normalizedURL =
                        rootPath + url.substr(index + 1).replace(/^(\.?\/)/, '');

                    if(files.has(normalizedURL)) {
                        const bloburl = URL.createObjectURL( files.get(normalizedURL) );
                        this.runtimeURLs.push( bloburl ); 
                        return bloburl;
                    } 

                    return url;
                } );

                if (filename.match(/\.(gltf|glb)$/) && !documentProvided) {
                    // converting path to relative (TODO: check if all browsers will have leading slash here)
                    this.documentProvider.activeComponent.appendModel(path.substr(1), EDerivativeQuality.High);
                }
                else if (filename.match(/\.(svx.json)$/)) {
                    const mainView : MainView = document.getElementsByTagName('voyager-story')[0] as MainView;
                    const explorer : ExplorerApplication = mainView.app.explorerApp;
            
                    const bloburl = URL.createObjectURL( file );
                    this.runtimeURLs.push( bloburl );
                    explorer.loadDocument(bloburl);
                }
            }
        });
    }

    protected cleanupFiles() {
        this.runtimeURLs.forEach(( url ) => URL.revokeObjectURL( url ));
        // TODO: Clear array?
    }
}