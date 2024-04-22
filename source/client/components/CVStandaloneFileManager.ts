/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import CVMediaManager from "./CVMediaManager";
import { IFileInfo } from "client/../../libs/ff-scene/source/components/CAssetManager";
import { Dictionary } from "client/../../libs/ff-core/source/types";
import CSelection from "client/../../libs/ff-graph/source/components/CSelection";

////////////////////////////////////////////////////////////////////////////////


export default class CVStandaloneFileManager extends Component
{
    static readonly typeName: string = "CVStandaloneFileManager";
    static readonly isSystemSingleton = true;

    private runtimeURLs: Array<string> = [];
    private fileMap: Dictionary<File> = {};
    private rootMap = {};

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

        // add url modifier callback to return correct url
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
    }

    dispose()
    {
        this.assetManager.outs.completed.off("value", this.cleanupFiles, this);
        super.dispose();
    }

    getFile(path: string) : File
    {
        return path in this.fileMap ? this.fileMap[path] : null;
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
        // add folders to map
        const parts = uri.split("/").filter(part => !!part);
        let folderPath = "";
        for (let i = 0, nj = parts.length-1; i < nj; i++) {
            folderPath = folderPath.concat(parts[i], "/");
            this.fileMap[folderPath] = null;
        }

        const idx = uri.lastIndexOf("/");
        const filename = idx > -1 ? uri.substr(idx + 1) : uri;
        const rootPath = uri.replace(filename, '');
        
        const normalizedURL = uri.startsWith("/") ? uri.substr(1) : uri;  // strip potential leading slash

        this.rootMap[filename] = rootPath;
        this.fileMap[normalizedURL] = new File(data, filename);

        if(this.runtimeURLs[normalizedURL]) {
            this.runtimeURLs[normalizedURL] = null;
        }

        this.mediaManager.refresh();
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

    reload() {
        this.cleanupFiles();
        this.runtimeURLs.length = 0;
        this.fileMap = {};
        this.rootMap = {};

        this.fileMap["/"] = null;  // needs base path for asset tree to generate correctly
        this.fileMap["articles/"] = null;
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
        else if(filenameLower.match(/\.(jpg|jpeg)$/)) {
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
}