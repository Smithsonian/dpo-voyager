/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
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

import CVAssetWriter from "./CVAssetWriter";
import CVTaskProvider from "./CVTaskProvider";
import CVDocumentProvider from "./CVDocumentProvider";
import CVDocument, { INodeComponents } from "./CVDocument";

import { ETaskMode } from "../applications/taskSets";


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

        const document = this.documentProvider.activeComponent;
        const mode = this.taskProvider.ins.mode.getValidatedValue();
        const components: INodeComponents = mode === ETaskMode.QC ? { model: true } : null;

        if (document && ins.save.changed) {
            const data = document.deflateDocument(components);
            this.assetWriter.putJSON(data, document.assetPath)
                .then(() => new Notification(`Successfully uploaded file to '${document.assetPath}'`, "info", 4000))
                .catch(e => new Notification(`Failed to upload file to '${document.assetPath}'`, "error", 8000));
        }

        if (document && ins.download.changed) {
            const data = document.deflateDocument(components);
            const fileName = this.assetWriter.getAssetFileName(document.assetPath);
            download.json(data, fileName);
        }

        return false;
    }

    protected beforeUnload(event)
    {
        event.returnValue = "x";
        //return "x";
    }
}