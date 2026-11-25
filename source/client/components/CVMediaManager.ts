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
import CVModel2, { IModelLoadEvent } from "./CVModel2";
import { EAssetType, EDerivativeQuality, EDerivativeUsage, EMapType, TDerivativeQuality } from "client/schema/model";
import CSelection from "@ff/graph/components/CSelection";
import CVMeta from "./CVMeta";
import Article from "client/models/Article";
import CVEnvironment from "./CVEnvironment";
import ImageImportMenu from "client/ui/story/ImageImportMenu";
import CVAssetReader from "./CVAssetReader";
import NVNode from "client/nodes/NVNode";
import CVImagePlane from "./CVImagePlane";
import { dispatchImportFiles, IFileImportResult } from "client/io/ImportFilesEvent";

////////////////////////////////////////////////////////////////////////////////

export { IAssetOpenEvent };

export interface IAssetRenameEvent extends ITypedEvent<"asset-rename">
{
    oldPath: string;
    newPath: string;
}

/** Asks the drop zone to pick files, to import as if they were dropped */
export type IPickFilesEvent = ITypedEvent<"pick-files">;

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
    protected get assetReader() {
        return this.getMainComponent(CVAssetReader);
    }
    protected get environment() {
      return this.system.getComponent(CVEnvironment);
    }
    protected get metas() {
        return this.system.getComponents(CVMeta);
    }

    /**
     * Import files into the scene, as the Navigator's "Import" button does:
     * by the host if it takes the import over (see {@link ImportFilesEvent}), by picking files to drop otherwise.
     */
    openImport()
    {
        if (!this.handleHostImport([])) {
            this.emit<IPickFilesEvent>({ type: "pick-files" });
        }
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

    uploadFile(name: string, blob: Blob, folder?: IAssetEntry): Promise<any>
    {
        const filename = decodeURI(name);
        const filepath = folder?.info?.path?.length > 1 ? folder.info.path + filename : filename;
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

        // The host may take over every drop that's not a scene's
        if (!documentProvided && this.handleHostImport(fileArray.map(([path, file]) => [path.replace(/^\/+/, ""), file]))) {
            return;
        }

        fileArray.forEach(([path, file]) => {
            const cleanfileName = decodeURI(file.name);
            const filenameLower = cleanfileName.toLowerCase();
            
            if (filenameLower.match(/\.(gltf|glb|bin|svx.json|html|jpg|jpeg|png|usdz|mp3|vtt|hdr)$/)) {

                if(!documentProvided && filenameLower.match(/\.(jpg|jpeg|png|hdr)$/) && !fileArray.some(entry => entry[0].endsWith("gltf"))) {
                    path = CVMediaManager.articleFolder + "/" + cleanfileName;
                    path = CVMediaManager.articleFolder + "/" + this.getUniqueName(path);
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
                else if (!documentProvided && !fileArray.some(entry => entry[0].endsWith("gltf")) && filenameLower.match(/\.(hdr|jpg|jpeg|png)$/)) {
                    this.uploadFile(normalizedPath, file, this.root).then(() => this.handleImageImport(normalizedPath));
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

        ImportMenu.show(mainView, activeDoc.setup.language, filename).then(([quality, parentName]) => {
            const model = this.getSystemComponents(CVModel2).find(element => element.node.name === parentName);
            this.applyImport({
                kind: "model",
                target: model ? model.id : null,
                name: parentName,
                derivatives: [{ quality: EDerivativeQuality[quality] as TDerivativeQuality, uri: filepath }],
            });
        }).catch(e => {
            const asset = this.getAssetByPath(filepath);
            this.delete(asset);
        });
    }

    protected handleImageImport(filepath: string) {
        const mainView : MainView = document.getElementsByTagName('voyager-story')[0] as MainView;
        const activeDoc = this.getMainComponent(CVDocumentProvider).activeComponent;
        const filename = filepath.substr(filepath.lastIndexOf("/") + 1);
        const asset = this.getAssetByPath(filepath);
        const rootPath = filename;

        ImageImportMenu.show(mainView, activeDoc.setup.language, filename).then((returnVals) => {
            const type = returnVals[0];
            switch(type) {
                case "environment":
                    this.applyImport({ kind: "environment", uri: filepath });
                    break;
                case "overlay":
                    // move overlay out of assets folder - lifecycle handled by parent object
                    this.move(asset, this.root).then(() => {  
                        const parentName = returnVals[1];
                        const model = this.getSystemComponents(CVModel2).find(element => element.node.name === parentName);
                        this.applyImport({ kind: "overlay", target: model.id, uri: rootPath });
                    });        
                    break;
                case "plane":
                    // move plane geometry out of assets folder - lifecycle handled by parent object
                    this.move(asset, this.root).then(() => this.applyImport({ kind: "plane", uri: rootPath }));
                    break;
            }
        }).catch(e => {
            this.delete(asset);
        });
    }

    /**
     * Add imported files to the scene, as an import menu says: Voyager's, or the host's (see {@link ImportFilesEvent}).
     * The files are in the scene already.
     */
    protected applyImport(result: IFileImportResult)
    {
        if (!result) {
            return; // Files for the scene to use later
        }
        const activeDoc = this.getMainComponent(CVDocumentProvider).activeComponent;
        const findModel = (id: string) => {
            const model = this.getSystemComponents(CVModel2).find(element => element.id === id);
            if (!model) {
                throw new Error(`No model with id ${id} to import to`);
            }
            return model;
        };

        switch (result.kind) {
            case "model": {
                const selection = this.getMainComponent(CSelection);
                const derivatives = result.derivatives.map(({ quality, uri }) => ({ quality: EDerivativeQuality[quality], uri }));
                const quality = derivatives[derivatives.length - 1].quality; // The highest, that shows
                const model = result.target === null ? undefined : findModel(result.target);
                this.assetManager.ins.initialLoad.setValue(true);
                if(model === undefined) {
                    const [ first, ...others ] = derivatives;
                    const newModel = activeDoc.appendModel(first.uri, first.quality);
                    others.forEach(({ quality, uri }) => newModel.derivatives.createModelAsset(uri, quality));
                    const name = result.name;
                    newModel.node.name = name;
                    newModel.ins.name.setValue(name);
                    newModel.ins.quality.setValue(quality);
                    newModel.once<IModelLoadEvent>("model-load", () => {selection.selectNode(newModel.node); 
                        this.assetManager.outs.initialLoad.setValue(false)}, this);
                }
                else {
                    derivatives.forEach(({ quality, uri }) => {
                        model.derivatives.remove(EDerivativeUsage.Web3D, quality);
                        model.derivatives.createModelAsset(uri, quality)
                    });
                    model.ins.quality.setValue(quality);
                    model.outs.updated.set();
                    model.once<IModelLoadEvent>("model-load", () => {selection.selectNode(model.node); 
                        this.assetManager.outs.initialLoad.setValue(false)}, this);
                }
                break;
            }
            case "environment":
                this.environment.addImage(result.uri);
                break;
            case "overlay": {
                const model = findModel(result.target);
                const newAsset = model.activeDerivative.createAsset(EAssetType.Image, result.uri);
                newAsset.data.mapType = EMapType.Zone;
                const overlay = model.getOverlay(result.uri);
                overlay.asset = newAsset;
                overlay.fromFile = true;
                model.ins.overlayMap.setValue(model.getOverlays().length);
                break;
            }
            case "plane": {
                const nvNode = activeDoc.root.graph.createCustomNode(NVNode);
                const plane = nvNode.transform.createComponent(CVImagePlane);
                plane.setImage(result.uri);
                const derivative = plane.derivatives.getOrCreate(EDerivativeUsage.Image2D, EDerivativeQuality.High);
                derivative.createAsset(EAssetType.Image, result.uri);
                activeDoc.root.scene.transform.addChild(plane.transform);
                nvNode.name = "ImagePlane";
                plane.ins.name.setValue(nvNode.name);
                break;
            }
            default:
                throw new Error(`Unknown import: ${JSON.stringify(result)}`);
        }
    }

    /**
     * Offer the host to import files, with an "import-files" event on `<voyager-story>` (see {@link ImportFilesEvent}).
     * If it takes the import over, do what it says once the files are in the scene.
     * @param files the files by their path among them, or none for the host to ask for them
     * @returns whether the host took the import over
     */
    protected handleHostImport(files: Iterable<[string, File]>): boolean {
        const mainView = document.getElementsByTagName("voyager-story")[0];
        const activeDoc = this.getMainComponent(CVDocumentProvider).activeComponent;
        if (!mainView || !activeDoc) {
            return false;
        }
        const models = activeDoc.setup.language.getGraphComponents(CVModel2).filter(model => !model.is(CVImagePlane));

        const imported = dispatchImportFiles(mainView, new Map(files), models.map(model => ({
            id: model.id,
            name: model.node.name,
            qualities: model.derivatives.getByUsage(EDerivativeUsage.Web3D).map(derivative => EDerivativeQuality[derivative.data.quality] as TDerivativeQuality),
        })));
        if (!imported) {
            return false;
        }

        imported
        .then(result => this.refresh().then(() => this.applyImport(result)))
        .catch(e => {
            // Cancelled: nothing to tell
            if (e && e.name !== "AbortError") {
                console.error("Import failed:", e);
            }
        });
        return true;
    }

    uploadFiles(files: FileList, folder: IAssetEntry): Promise<any>
    {
        const standaloneManager = this.standaloneFileManager;
        if(standaloneManager) {
            ; // TODO - considering removing this support
        }
        else {
            Array.from(files).forEach(file => {
                const uniqName = this.getUniqueName(folder.info.path + file.name);
                const file_uri = folder.info.path + uniqName;
                this.uploadFile(uniqName, file, folder).then(() => {
                    if (file.name.toLowerCase().match(/\.(hdr|jpg|jpeg|png)$/)) {     
                        this.handleImageImport(file_uri);
                    }
                });
            });
            return Promise.resolve(); // TODO - improve error handling
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
        const selected = this.selectedAssets;
        const standaloneManager = this.standaloneFileManager;
        if(standaloneManager) {
            selected.forEach(file => standaloneManager.deleteFile(file.info.url));
            selected.filter(asset => asset.info.name.toLowerCase().endsWith(".hdr"))
                .forEach(asset => this.environment.deleteImage(asset.info.path));

            return this.refresh();
        }
        else {
            return super.deleteSelected().then(() => {
              selected
                .filter(asset => asset.info.name.toLowerCase().endsWith(".hdr"))
                .forEach(asset => this.environment.deleteImage(asset.info.path));
            });
        }
    }

    move(asset: IAssetEntry, destinationFolder: IAssetEntry)
    {
        const standaloneManager = this.standaloneFileManager;
        const destinationUrl = destinationFolder.info.path + asset.info.url.split('/').pop();
        if(standaloneManager) {
            standaloneManager.moveFile(asset.info.url, destinationUrl);
            return this.refresh();
        }
        else {
            return this.exists(destinationUrl).then((result) => {return result ? super.delete(asset) : super.move(asset, destinationFolder)});
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