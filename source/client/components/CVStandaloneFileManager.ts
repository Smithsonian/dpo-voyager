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

import Component, { Node } from "@ff/graph/Component";

import CVAssetManager from "./CVAssetManager";
import CVDocumentProvider from "./CVDocumentProvider";

import Notification from "@ff/ui/Notification";

import { SimpleDropzone } from 'simple-dropzone';
import ExplorerApplication from "client/applications/ExplorerApplication";
import MainView from "client/ui/story/MainView";
import CVMediaManager from "./CVMediaManager";
import { IFileInfo } from "client/../../libs/ff-scene/source/components/CAssetManager";
import { Dictionary } from "client/../../libs/ff-core/source/types";
import ImportMenu from "client/ui/story/ImportMenu";
import CVModel2 from "./CVModel2";
import { EDerivativeUsage } from "client/schema/model";
import CSelection from "client/../../libs/ff-graph/source/components/CSelection";

////////////////////////////////////////////////////////////////////////////////


export default class CVStandaloneFileManager extends Component
{
    static readonly typeName: string = "CVStandaloneFileManager";
    static readonly isSystemSingleton = true;

    private runtimeURLs: Array<string> = [];
    private fileMap: Dictionary<File> = {};
    private rootMap = {};
    private importQueue: string[] = [];


    private isConfigured: boolean = null;
    private documentLoaded: boolean = false;

    protected get documentProvider() {
        return this.getMainComponent(CVDocumentProvider);
    }
    protected get selection() {
        return this.getMainComponent(CSelection);
    }
    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }
    protected get mediaManager() {
        return this.system.getMainComponent(CVMediaManager);
    }

    constructor(node: Node, id: string)
    {
        super(node, id);
    }

    create()
    {
        super.create();
        this.assetManager.outs.completed.on("value", this.cleanupFiles, this);

        this.fileMap["/"] = null;  // needs base path for asset tree to generate correctly
        this.fileMap["articles/"] = null;
        this.mediaManager.refresh();
    }

    dispose()
    {
        this.assetManager.outs.completed.off("value", this.cleanupFiles, this);
        super.dispose();
    }

    getFile(name: string) : File
    {
        return this.fileMap[name];
    }

    getFiles() : File[]
    {
        return Object.keys(this.fileMap).map(key => this.fileMap[key]);
    }

    getFilePath(filename: string) : string
    {
        return this.rootMap[filename];
    }
    
    addFile(uri: string, data: BlobPart[] = [])
    {
        const idx = uri.lastIndexOf("/");
        const filename = idx > -1 ? uri.substr(idx + 1) : uri;
        const rootPath = uri.replace(filename, '');

        this.rootMap[filename] = rootPath;
        this.fileMap[uri] = new File(data, filename);

        if(this.runtimeURLs[uri]) {
            this.runtimeURLs[uri] = null;
        }
    }

    deleteFile(uri: string)
    {
        delete this.fileMap[uri];
    }

    renameFile(uri: string, name: string)
    {
        const file = this.fileMap[uri];
        const newUri = uri.replace(file.name, name);
 
        this.addFile(newUri, [file]);
        delete this.fileMap[uri];
    }

    getFileInfos() : IFileInfo[]
    {
        return Object.keys(this.fileMap).map(key => this.createFileInfo(key, this.fileMap[key]));
    }

    blobUrlToFileUrl(bloburl: string) : string
    {
        const urlList = this.runtimeURLs;
        return Object.keys(urlList).find(key => urlList[key] === bloburl);
    }

    update()
    {
        if(!this.isConfigured) {
            const explorerPanel = document.getElementsByClassName('sv-explorer-panel')[0];
            const input = document.querySelector('#fileInput');
            const dropZone = new SimpleDropzone(explorerPanel, input);
            dropZone.on('drop', ({files}: any) => this.onFileDrop(files));
            this.isConfigured = true;
        }

        return false;
    }
    
    protected onFileDrop(files: Map<string, File>)
    {
        const fileArray = Array.from(files);
        const hasDoc = this.documentLoaded;
        
        const docIndex = fileArray.findIndex( (element) => { return element[0].toLowerCase().indexOf(".svx.json") > -1 });
        const documentProvided : boolean = docIndex > -1;
        if(documentProvided) {
            fileArray.push(fileArray.splice(docIndex,1)[0]);

            if(hasDoc) {
                this.reload();
            }

            this.documentLoaded = true;
        }
        const documentRoot = documentProvided ? fileArray[fileArray.length-1][0].replace(fileArray[fileArray.length-1][1].name, '') : "";

        fileArray.forEach(([path, file]) => {
            const cleanfileName = decodeURI(file.name);
            const filenameLower = cleanfileName.toLowerCase();
            if (filenameLower.match(/\.(gltf|glb|bin|svx.json|html|jpg|png|usdz)$/)) {

                if(!documentProvided && filenameLower.match(/\.(jpg|png)$/) && !fileArray.some(entry => entry[0].endsWith("gltf"))) {
                    path = CVMediaManager.articleFolder + "/" + cleanfileName;
                }

                // add folders to map
                const parts = path.split("/").filter(part => !!part);
                let folderPath = "";
                for (let i = 0, nj = parts.length-1; i < nj; i++) {
                    folderPath = folderPath.concat(parts[i], "/");
                    this.fileMap[folderPath] = null;
                }

                // normalize path relative to document root
                path = documentProvided ? path.replace(documentRoot, '') : (path.startsWith("/") ? path.substr(1) : path);
                const rootPath = path.replace(cleanfileName, '');
                this.rootMap[cleanfileName] = rootPath;
                
                this.fileMap[path] = file;

                this.assetManager.loadingManager.setURLModifier( ( url ) => {

                    url = decodeURI(url);
                    const index = url.lastIndexOf('/');
                    const filename = url.substr(index + 1).replace(/^(\.?\/)/, '');

                    const baseURL = this.rootMap[filename] + filename;
                    const normalizedURL = baseURL.startsWith("/") ? baseURL.substr(1) : baseURL;  // strip potential leading slash

                    if(this.runtimeURLs[normalizedURL]) {
                        return this.runtimeURLs[normalizedURL];
                    }
                    if(this.fileMap[normalizedURL]) {
                        const bloburl = URL.createObjectURL( this.fileMap[normalizedURL] );
                        this.runtimeURLs[normalizedURL] = bloburl;
                        return bloburl;
                    } 

                    return url;
                } );

                if (!documentProvided && filenameLower.match(/\.(gltf|glb)$/)) {
                    this.importQueue.push(path);
                }
                else if (filenameLower.match(/\.(svx.json)$/)) {
                    const mainView : MainView = document.getElementsByTagName('voyager-story')[0] as MainView;
                    const explorer : ExplorerApplication = mainView.app.explorerApp;
            
                    explorer.loadDocument(path);
                    this.documentProvider.refreshDocument();
                    
                    //this.assetReader.getJSON(path).then(data => this.documentProvider.createDocument(data, path))
                }
            }
            else {
                new Notification(`Unhandled file: '${cleanfileName}'`, "warning", 4000);
            }
        });

        if(this.importQueue.length > 0) {
            this.handleModelImport(this.importQueue.pop());
        }
        this.mediaManager.refresh(); 
    }

    protected cleanupFiles() 
    {
        this.runtimeURLs.forEach(( url ) => URL.revokeObjectURL( url ));
        // TODO: Clear array?
    }

    protected createFileInfo(path: string, file: File): IFileInfo
    {
        const filename = file ? file.name : path.split("/").filter(part => !!part).pop() || "";
        const filenameLower = filename.toLowerCase();

        const info: Partial<IFileInfo> = {
            url: path,
            name: file ? file.name : filename,
            //modified: file.lastModified ? file.lastModified.toString() : "",
            folder: file === null,
            size: file ? file.size : 0,
        };

        if(filenameLower.match(/\.(html)$/)) {
            info.type = "text/html"
        }
        else if(filenameLower.match(/\.(jpg)$/)) {
            info.type = "image/jpeg"
        }
        else if(filenameLower.match(/\.(png)$/)) {
            info.type = "image/png"
        }
        else {
            info.type = "";
        }

        info.path = path;

        return info as IFileInfo;
    }

    protected handleModelImport(filepath: string) {
        const mainView : MainView = document.getElementsByTagName('voyager-story')[0] as MainView;
        const activeDoc = this.documentProvider.activeComponent;
        const importQueue = this.importQueue;
        const filename = this.fileMap[filepath].name;

        ImportMenu.show(mainView, activeDoc.setup.language, filename).then(([quality, parentName]) => {
            const model = this.getSystemComponents(CVModel2).find(element => element.node.name === parentName);
            if(model === undefined) {
                // converting path to relative (TODO: check if all browsers will have leading slash here)
                const newModel = activeDoc.appendModel(filepath, quality);
                const name = parentName;
                newModel.node.name = name;
                newModel.ins.name.setValue(name);
                newModel.ins.quality.setValue(quality);
                this.selection.selectNode(newModel.node);
            }
            else {
                model.derivatives.remove(EDerivativeUsage.Web3D, quality);
                model.derivatives.createModelAsset(filepath, quality)
                model.ins.quality.setValue(quality);
                model.outs.updated.set();
                this.selection.selectNode(model.node);
            }

            if(importQueue.length > 0) {
                this.handleModelImport(importQueue.pop());
            }
        }).catch(e => {});
    }

    protected reload() {
        this.cleanupFiles();
        this.runtimeURLs.length = 0;
        this.fileMap = {};
        this.rootMap = {};

        this.fileMap["/"] = null;  // needs base path for asset tree to generate correctly
        this.fileMap["articles/"] = null;
        this.mediaManager.refresh();
    }
}