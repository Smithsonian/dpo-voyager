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

import Notification from "@ff/ui/Notification";
import MessageBox from "@ff/ui/MessageBox";

import CVMediaManager, { IAssetOpenEvent } from "./CVMediaManager";
import { IFileInfo } from "client/../../libs/ff-scene/source/assets/WebDAVProvider";
import ImportMenu from "client/ui/story/ImportMenu";
import MainView from "client/ui/story/MainView";
import CVDocumentProvider from "./CVDocumentProvider";
import CVModel2 from "./CVModel2";
import { EDerivativeUsage } from "client/schema/model";
import CVAssetManager from "./CVAssetManager";
import { IAssetTreeChangeEvent } from "client/../../libs/ff-scene/source/components/CAssetManager";


////////////////////////////////////////////////////////////////////////////////

export default class CVModelEditor extends Component
{
    static readonly typeName: string = "CVModelEditor";
    static readonly isSystemSingleton = true;
    protected get mediaManager() {
        return this.system.getMainComponent(CVMediaManager);
    }
    protected get assetManager(){
        return this.getMainComponent(CVAssetManager);
    }
    protected get documentProvider() {
        return this.getMainComponent(CVDocumentProvider);
    }

    create()
    {
        super.create();
        this.mediaManager.on<IAssetOpenEvent>("asset-open", this.onOpenAsset, this);
        this.mediaManager.on<IAssetTreeChangeEvent>("tree-change", this.onTreeChange, this);
    }

    dispose()
    {
        super.dispose();
        this.mediaManager.off<IAssetOpenEvent>("asset-open", this.onOpenAsset, this);
        this.mediaManager.off<IAssetTreeChangeEvent>("tree-change", this.onTreeChange, this);
    }

    protected onOpenAsset(event: IAssetOpenEvent)
    {
        console.log("Open asset : ", event.asset?.info);
        // if there is no asset, close any current article
        if(event.asset === null ) {
            //Close
        } else if (event.asset.info.name.toLowerCase().endsWith(".glb")) {
           this.importModel(event.asset.info);
        }
    }

    protected onTreeChange(event: IAssetTreeChangeEvent){
        console.log("Tree change", event);
    }

    private importModel(file :IFileInfo){
        const mainView : MainView = document.getElementsByTagName('voyager-story')[0] as MainView;
        const activeDoc = this.documentProvider.activeComponent;
        ImportMenu.show(mainView, activeDoc.setup.language, file.name).then(([quality, parentName]) => {
            const model = this.getSystemComponents(CVModel2).find(element => element.node.name === parentName);
            if(typeof model === "undefined") {
                const newModel = activeDoc.appendModel(file.path, quality);
                const name = parentName;
                newModel.node.name = name;
                newModel.ins.name.setValue(name);
                newModel.ins.quality.setValue(quality);
            }
            else {
                model.derivatives.remove(EDerivativeUsage.Web3D, quality);
                model.derivatives.createModelAsset(file.path, quality)
                model.ins.quality.setValue(quality);
                model.outs.updated.set();
            }
        }).catch(e => {
            if(e){
                console.error(e);
                Notification.show(`Failed to edit model : ${e.message}`, "error");
            }
        });
    }
}