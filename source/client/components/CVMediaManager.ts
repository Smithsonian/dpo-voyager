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

import CAssetManager, { IAssetOpenEvent, IFileInfo, IAssetTreeChangeEvent, IAssetEntry } from "@ff/scene/components/CAssetManager";
import Notification from "@ff/ui/Notification";
import CVStandaloneFileManager from "./CVStandaloneFileManager";
import CVAssetManager from "./CVAssetManager";
import resolvePathname from "resolve-pathname";

////////////////////////////////////////////////////////////////////////////////

export { IAssetOpenEvent };

export default class CVMediaManager extends CAssetManager
{
    static readonly typeName: string = "CVMediaManager";

    static readonly articleFolder: string = "articles";

    protected get standaloneFileManager() {
        return this.getGraphComponent(CVStandaloneFileManager, true);
    }
    protected get assetManager() {
        return this.system.getMainComponent(CVAssetManager);
    }

    create()
    {
        super.create();
        this.assetManager.ins.baseUrlValid.on("value", this.refreshRoot, this);
    }

    dispose()
    {
        this.assetManager.ins.baseUrlValid.off("value", this.refreshRoot, this);
        super.dispose();
    }

    protected rootUrlChanged(): Promise<any>
    {
        if(this.assetManager.ins.baseUrlValid.value) {
            return this.createArticleFolder();
        }
        return Promise.resolve();
    }

    protected createArticleFolder(): Promise<any>
    {
        const folderName = CVMediaManager.articleFolder;
        return this.exists(folderName).then(result => {
            if (!result) {
                const root = this.root;
                const infoText = `folder '${folderName}' in '${root.info.path}.'`;
                return this.createFolder(root, folderName)
                .then(() => Notification.show(`Created ${infoText}'`))
                .catch(error => Notification.show(`Failed to create ${infoText}`));
            }
        });
    }

    getAssetURL(uri: string)
    {
        return this.assetManager.getAssetUrl(resolvePathname(uri, this.rootUrl));
    }

    uploadFile(name: string, blob: Blob, folder: IAssetEntry): Promise<any>
    {
        const filename = decodeURI(name);
        const url = resolvePathname(folder.info.path + filename, this.rootUrl);
        
        if(this.standaloneFileManager) {
            this.standaloneFileManager.addFile(CVMediaManager.articleFolder + "/" + filename, [blob]);
            this.refresh();
            return Promise.resolve();
        }
        else {
            const params: RequestInit = { method: "PUT", credentials: "include", body: new File([blob], filename) };
            return fetch(url, params).then(() => this.refresh());
        }
    }

    ingestFiles(files: Map<string, File>)
    {
        if(this.standaloneFileManager) {
            this.standaloneFileManager.onFileDrop(files);
        }
        else {
            const fileList = new DataTransfer();
            files.forEach(file => fileList.items.add(file));
            this.uploadFiles(fileList.files, this.root);
        }
    }

    refresh()
    {
        const standaloneManager = this.standaloneFileManager;
        if(standaloneManager) {
            const infos = standaloneManager.getFileInfos();
            this.root = this.createAssetTree(infos); 
            this.emit<IAssetTreeChangeEvent>({ type: "tree-change", root: this.root });
            return Promise.resolve();
        }
        else {
            if(this.assetManager.ins.baseUrlValid.value) {
                return super.refresh();
            }
            else {
                return Promise.resolve();
            }
        }
    }

    rename(asset: IAssetEntry, name: string): Promise<void>
    {
        if(name.split('.').length <= 1) {
            Notification.show(`New name must include file extension`, "error");
            return Promise.reject();
        }

        const standaloneManager = this.standaloneFileManager;
        if(standaloneManager) {
            standaloneManager.renameFile(asset.info.url, name);
            return this.refresh();
        }
        else {
            return super.rename(asset, name);
        }
    }

    delete(asset: IAssetEntry)
    {
        const standaloneManager = this.standaloneFileManager;
        if(standaloneManager) {
            standaloneManager.deleteFile(asset.info.url);
            return this.refresh();
        }
        else {
            return super.delete(asset);
        }
    }

    deleteSelected()
    {
        const standaloneManager = this.standaloneFileManager;
        if(standaloneManager) {
            const selected = this.selectedAssets;
            selected.forEach(file => standaloneManager.deleteFile(file.info.url));

            return this.refresh();
        }
        else {
            return super.deleteSelected();
        }
    }

    refreshRoot()
    {
        if(this.assetManager.ins.baseUrlValid.value) {
            super.refresh().then(() => this.rootUrlChanged());
        }
    }
}