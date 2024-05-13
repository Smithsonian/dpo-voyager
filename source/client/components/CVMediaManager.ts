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

import CAssetManager, { IAssetOpenEvent, IFileInfo, IAssetTreeChangeEvent, IAssetEntry } from "@ff/scene/components/CAssetManager";
import Notification from "@ff/ui/Notification";
import CVStandaloneFileManager from "./CVStandaloneFileManager";
import CVAssetManager from "./CVAssetManager";
import resolvePathname from "resolve-pathname";
import { ITypedEvent } from "@ff/graph/Component";
import ExplorerApplication from "client/applications/ExplorerApplication";
import MainView from "client/ui/explorer/MainView";
import CVDocumentProvider from "./CVDocumentProvider";
import ImportMenu from "client/ui/story/ImportMenu";
import CVModel2 from "./CVModel2";
import { EDerivativeUsage } from "client/schema/model";
import CSelection from "@ff/graph/components/CSelection";
import CVMeta from "./CVMeta";
import Article from "client/models/Article";

////////////////////////////////////////////////////////////////////////////////

export { IAssetOpenEvent };

export interface IAssetRenameEvent extends ITypedEvent<"asset-rename">
{
    oldPath: string;
    newPath: string;
}

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
    protected get metas() {
        return this.system.getComponents(CVMeta);
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
        if(this.assetManager.ins.baseUrlValid.value && !this.standaloneFileManager) {
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
        const filepath = folder.info.path.length > 1 ? folder.info.path + filename : filename;
        const url = resolvePathname(filepath, this.rootUrl);
        
        if(this.standaloneFileManager) {
            this.standaloneFileManager.addFile(filepath, [blob]);
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
        // If a scene file has been dropped, push to end
        const fileArray = Array.from(files);
        const docIndex = fileArray.findIndex( (element) => { return element[0].toLowerCase().indexOf(".svx.json") > -1 });
        const documentProvided : boolean = docIndex > -1;
        if(documentProvided) {
            fileArray.push(fileArray.splice(docIndex,1)[0]);

            // we have a new scene, so clear out standalone file manager
            if(this.standaloneFileManager) {
                this.standaloneFileManager.reload();
            }
        }

        const documentRoot = documentProvided ? fileArray[fileArray.length-1][0].replace(fileArray[fileArray.length-1][1].name, '') : "";

        fileArray.forEach(([path, file]) => {
            const cleanfileName = decodeURI(file.name);
            const filenameLower = cleanfileName.toLowerCase();
            
            if (filenameLower.match(/\.(gltf|glb|bin|svx.json|html|jpg|jpeg|png|usdz|mp3|vtt)$/)) {

                if(!documentProvided && filenameLower.match(/\.(jpg|jpeg|png)$/) && !fileArray.some(entry => entry[0].endsWith("gltf"))) {
                    path = CVMediaManager.articleFolder + "/" + cleanfileName;
                }

                // normalize path relative to document root
                let normalizedPath = documentProvided ? path.replace(documentRoot, '') : path;
                normalizedPath = normalizedPath.startsWith("/") ? normalizedPath.substr(1) : normalizedPath;

                if (filenameLower.match(/\.(svx.json)$/)) {
                    const mainView : MainView = document.getElementsByTagName('voyager-explorer')[0] as MainView;
                    const explorer : ExplorerApplication = mainView.application;
            
                    this.uploadFile(normalizedPath, file, this.root).then(() => {
                        explorer.loadDocument(normalizedPath).then(() =>
                            this.getMainComponent(CVDocumentProvider).refreshDocument()
                        );
                    }); 
                }
                else if (!documentProvided && filenameLower.match(/\.(gltf|glb)$/)) {
                    this.uploadFile(normalizedPath, file, this.root).then(() => this.handleModelImport(normalizedPath));
                }
                else {
                    this.uploadFile(normalizedPath, file, this.root);
                }
            }
            else {
                new Notification(`Unhandled file: '${cleanfileName}'`, "warning", 4000);
            }
        });
    }

    protected handleModelImport(filepath: string) {
        const mainView : MainView = document.getElementsByTagName('voyager-story')[0] as MainView;
        const activeDoc = this.getMainComponent(CVDocumentProvider).activeComponent;
        const filename = filepath.substr(filepath.lastIndexOf("/") + 1);
        const selection = this.getMainComponent(CSelection);

        ImportMenu.show(mainView, activeDoc.setup.language, filename).then(([quality, parentName]) => {
            const model = this.getSystemComponents(CVModel2).find(element => element.node.name === parentName);
            if(model === undefined) {
                // converting path to relative (TODO: check if all browsers will have leading slash here)
                const newModel = activeDoc.appendModel(filepath, quality);
                const name = parentName;
                newModel.node.name = name;
                newModel.ins.name.setValue(name);
                newModel.ins.quality.setValue(quality);
                selection.selectNode(newModel.node);
            }
            else {
                model.derivatives.remove(EDerivativeUsage.Web3D, quality);
                model.derivatives.createModelAsset(filepath, quality)
                model.ins.quality.setValue(quality);
                model.outs.updated.set();
                selection.selectNode(model.node);
            }
        }).catch(e => {});
    }

    uploadFiles(files: FileList, folder: IAssetEntry): Promise<any>
    {
        const standaloneManager = this.standaloneFileManager;
        if(standaloneManager) {
            ; // TODO - considering removing this support
        }
        else {
            return super.uploadFiles(files, folder);
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

        const parts = asset.info.path.split("/");
        parts.pop();
        const newPath = parts.join("/") + "/" + name;

        const standaloneManager = this.standaloneFileManager;
        if(standaloneManager) {
            standaloneManager.renameFile(asset.info.url, name);
            return this.refresh().then(() => this.postRenameHandler(asset.info.path, newPath));
        }
        else {
            return super.rename(asset, name).then(() => this.postRenameHandler(asset.info.path, newPath));
        }
    }

    protected postRenameHandler(oldPath: string, newPath: string)
    {
        // If this asset is an article, change the uri for the data object as well
        this.metas.forEach(meta => {
            const article: Article = meta.articles.items.find(e => e.uri === oldPath);
            if(article !== undefined) {
                article.uri = newPath;
            }
        });

        this.emit<IAssetRenameEvent>({ type: "asset-rename", oldPath: oldPath, newPath: newPath })
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
            this.refresh().then(() => this.rootUrlChanged());
        }
    }

    getUniqueName(path: string) : string
    {
        let filename = path.split("/").pop();
        const standaloneManager = this.standaloneFileManager;
        const exists = standaloneManager ? standaloneManager.getFile(path) : this.getAssetByPath(path);
        if(exists) {
            filename = Date.now() + "_" + filename;
        }

        return filename;
    }
}