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

import { Dictionary } from "@ff/core/types";

import download from "@ff/browser/download";
import convert from "@ff/browser/convert";

import { Node, types } from "@ff/graph/Component";

import Notification from "@ff/ui/Notification";
import CRenderer from "@ff/scene/components/CRenderer";

import { EAssetType, EDerivativeQuality, EDerivativeUsage } from "client/schema/model";

import NVNode from "../nodes/NVNode";
import CVMeta from "./CVMeta";
import CVModel2 from "./CVModel2";
import CVAssetManager from "./CVAssetManager";
import CVTask from "./CVTask";

import CaptureTaskView from "../ui/story/CaptureTaskView";
import { TImageQuality } from "client/schema/meta";
import CVNodeProvider from "./CVNodeProvider";
import CVStandaloneFileManager from "./CVStandaloneFileManager";
import CVDocument from "./CVDocument";
import CVSetup from "./CVSetup";

////////////////////////////////////////////////////////////////////////////////

const _qualityLevels: EDerivativeQuality[] = [
    EDerivativeQuality.Thumb,
    EDerivativeQuality.Low,
    EDerivativeQuality.Medium,
    EDerivativeQuality.High
];

const _sizePresets: Dictionary<number[]> = {
    [EDerivativeQuality.Thumb]:  [320, 320],   // Thumb
    [EDerivativeQuality.Low]:    [640, 640],   // Low
    [EDerivativeQuality.Medium]: [1280, 1280], // Medium
    [EDerivativeQuality.High]:   [2560, 2560]  // High
};

export enum EFileType { JPEG, PNG }

const _mimeTypes = {
    [EFileType.JPEG]: "image/jpeg",
    [EFileType.PNG]: "image/png"
};

const _typeExtensions = {
    [EFileType.JPEG]: "jpg",
    [EFileType.PNG]: "png"
};


export default class CVCaptureTask extends CVTask
{
    static readonly typeName: string = "CVCaptureTask";

    static readonly text: string = "Capture";
    static readonly icon: string = "camera";

    protected static readonly ins = {
        take: types.Event("Picture.Take"),
        save: types.Event("Picture.Save"),
        download: types.Event("Picture.Download"),
        remove: types.Event("Picture.Remove"),
        type: types.Enum("Picture.Type", EFileType),
        quality: types.Percent("Picture.Quality", 0.85),
        restore: types.Event("State.Restore"),
    };

    protected static readonly outs = {
        ready: types.Boolean("Picture.Ready"),
        updated: types.Boolean("Picture.Updated", false),
    };

    ins = this.addInputs<CVTask, typeof CVCaptureTask.ins>(CVCaptureTask.ins);
    outs = this.addOutputs<CVTask, typeof CVCaptureTask.outs>(CVCaptureTask.outs);

    activeMeta: CVMeta = null;
    activeModel: CVModel2 = null;
    isActiveScene: boolean = false;

    private _imageDataURIs: Dictionary<string> = {};
    private _imageElements: Dictionary<HTMLImageElement> = {};
    private _mimeType: string = "";
    private _extension: string = "";

    constructor(node: Node, id: string)
    {
        super(node, id);

        const configuration = this.configuration;
        //configuration.interfaceVisible = false;
        //configuration.annotationsVisible = false;
        configuration.bracketsVisible = true;
        //configuration.gridVisible = false;
    }

    protected get renderer() {
        return this.getMainComponent(CRenderer);
    }
    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }
    protected get nodeProvider() {
        return this.getMainComponent(CVNodeProvider);
    }
    protected get setup() {
        return this.getSystemComponent(CVSetup);
    }

    getImageElement(quality: EDerivativeQuality = EDerivativeQuality.Low)
    {
        return this._imageElements[quality];
    }

    createView()
    {
        return new CaptureTaskView(this);
    }

    activateTask()
    {
        // automatically select scene node
        this.nodeProvider.activeNode = this.nodeProvider.scopedNodes[0];
        
        this.startObserving();
        super.activateTask();
    }

    deactivateTask()
    {
        this.stopObserving();
        super.deactivateTask();
    }

    create()
    {
        super.create();
        this.startObserving();
    }

    dispose()
    {
        this.stopObserving();
        super.dispose();
    }

    update()
    {
        const ins = this.ins;

        if (ins.take.changed) {
            const typeIndex = ins.type.getValidatedValue();
            this.takePictures(ins.quality.value, _mimeTypes[typeIndex], _typeExtensions[typeIndex]);
            this.setup.ins.saveState.set();
        }
        if (ins.save.changed) {
            this.savePictures();
        }
        if (ins.download.changed) {
            this.downloadPicture();
        }
        if (ins.remove.changed) {
            this.removePictures();
        }
        if (ins.restore.changed) {
            this.restoreState();
        }

        return true;
    }

    protected takePictures(compressionQuality: number, type: string, extension: string)
    {
        this._mimeType = type;
        this._extension = extension;

        const view = this.renderer.views[0];
        if (!view) {
            console.warn("can't render to image, no view attached");
            return;
        }

        _qualityLevels.forEach(quality => {
            const dataURI = view.renderImage(_sizePresets[quality][0], _sizePresets[quality][1], type, compressionQuality);
            this._imageDataURIs[quality] = dataURI;

            const imageElement = this._imageElements[quality] || document.createElement("img");
            imageElement.src = dataURI;
            this._imageElements[quality] = imageElement;
        });

        this.outs.ready.setValue(true);
    }

    protected savePictures()
    {
        if (!this.outs.ready.value) {
            return;
        }

        _qualityLevels.forEach(quality => {
            const dataURI = this._imageDataURIs[quality];
            const filePath = this.getImageAssetPath(quality, this._extension);
            const fileURL = this.assetManager.getAssetUrl(filePath);
            const fileName = this.assetManager.getAssetName(filePath);
            const blob = convert.dataURItoBlob(dataURI);
            const standaloneFM = this.graph.getMainComponent(CVStandaloneFileManager, true);

            if(standaloneFM) {
                standaloneFM.addFile(filePath, [blob]);
                this.updateImageMeta(quality, this._mimeType, filePath);
                new Notification(`Saved ${fileName} to scene package.`, "info", 4000);    
            }
            else {
                const file = new File([blob], fileName);
                fetch(fileURL, {
                    method:"PUT",
                    body: file,
                })
                .then(() => {
                    this.updateImageMeta(quality, this._mimeType, filePath);
                    new Notification(`Successfully uploaded image to '${fileURL}'`, "info", 4000);
                })
                .catch(e => {
                    new Notification(`Failed to upload image to '${fileURL}'`, "error", 8000);
                });
            }
        });
    }

    protected downloadPicture()
    {
        if (!this.outs.ready.value) {
            return;
        }

        const dataURI = this._imageDataURIs[EDerivativeQuality.High];
        const filePath = this.getImageAssetPath(EDerivativeQuality.High, this._extension);
        const fileName = this.assetManager.getAssetName(filePath);
        download.url(dataURI, fileName);
    }

    protected updateImageMeta(quality: EDerivativeQuality, mimeType: string, uri: string)
    {
        const model = this.activeModel;
        const meta = this.activeMeta;

        const byteSize = Math.ceil(this._imageDataURIs[quality].length / 4 * 3);
        const width = _sizePresets[quality][0];
        const height = _sizePresets[quality][1];
        const imageSize = Math.max(width, height);

        if (model) {
            const derivative = model.derivatives.getOrCreate(EDerivativeUsage.Image2D, quality);
            const asset = derivative.findAsset(EAssetType.Image) || derivative.createAsset(EAssetType.Image, uri);
            asset.data.byteSize = byteSize;
            asset.data.imageSize = imageSize;
            asset.data.mimeType = mimeType;
            asset.update();
        }
        if (meta) {
            const qualityName = EDerivativeQuality[quality];
            meta.images.insert({
                uri,
                quality: qualityName as TImageQuality,
                byteSize,
                width,
                height,
            }, qualityName);
        }

        this.outs.updated.setValue(true);
    }

    protected getImageAssetPath(quality: EDerivativeQuality, extension: string)
    {
        let assetBaseName = this.activeDocument.assetBaseName;

        if (this.activeNode.model) {
        }

        const qualityName = EDerivativeQuality[quality].toLowerCase();
        return `${assetBaseName}-image-${qualityName}.${extension}`;
    }

    protected removePictures()
    {
        console.warn("CCaptureTask.removePictures - not implemented yet");
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        super.onActiveDocument(previous, next);

        if(previous) {
            //
        }
        if (next) {
            if(this.isActiveTask) {
                this.onActiveNode(this.activeNode, this.activeNode); // refresh task data
            }
        }
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        if (previous && previous.meta) {
            this.outs.ready.setValue(false);
            this._imageElements = {};
            this._imageDataURIs = {};
        }

        this.isActiveScene = next && next.scene ? true : false;

        const model = this.activeModel = next && next.model;
        const meta = this.activeMeta = next && next.meta;
        const images = meta && meta.images;

        if (images) {
            _qualityLevels.forEach(quality => {
                const imageMeta = images.get(EDerivativeQuality[quality]);
                if (imageMeta) {
                    const imageElement = document.createElement("img");
                    imageElement.src = this.assetManager.getAssetUrl(imageMeta.uri);
                    this._imageElements[quality] = imageElement;
                }
            })
        }
        else if (model) {
            _qualityLevels.forEach(quality => {
                const derivative = model.derivatives.get(EDerivativeUsage.Image2D, quality);
                if (derivative) {
                    const imageAsset = derivative.findAsset(EAssetType.Image);
                    if (imageAsset) {
                        const imageElement = document.createElement("img");
                        imageElement.src = this.assetManager.getAssetUrl(imageAsset.data.uri);
                        this._imageElements[quality] = imageElement;
                    }
                }
            });
        }
    }

    protected restoreState()
    {
        this.setup.ins.restoreState.set();
    }
}