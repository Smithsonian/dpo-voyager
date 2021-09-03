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

////////////////////////////////////////////////////////////////////////////////

export { IAssetOpenEvent };

export default class CVMediaManager extends CAssetManager
{
    static readonly typeName: string = "CVMediaManager";

    static readonly articleFolder: string = "articles";

    protected get standaloneFileManager() {
        return this.getGraphComponent(CVStandaloneFileManager, true);
    }

    protected rootUrlChanged(): Promise<any>
    {
        const standaloneManager = this.standaloneFileManager;
        if(!standaloneManager) {
            return this.createArticleFolder();
        }
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
            return super.refresh();
        }
    }

    rename(asset: IAssetEntry, name: string): Promise<void>
    {
        const standaloneManager = this.standaloneFileManager;
        if(standaloneManager) {
            standaloneManager.renameFile(asset.info.url, name);
            return this.refresh();
        }
        else {
            return super.rename(asset, name);
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
}