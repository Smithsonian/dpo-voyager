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

import { Dictionary } from "@ff/core/types";

import download from "@ff/browser/download";
import fetch from "@ff/browser/fetch";
import convert from "@ff/browser/convert";

import { types, IComponentEvent } from "@ff/graph/Component";

import Notification from "@ff/ui/Notification";
import CRenderer from "@ff/scene/components/CRenderer";

import { EAssetType, EDerivativeQuality, EDerivativeUsage } from "../../core/models/Derivative";

import CVModel_old from "../../core/components/CVModel_old";
import NVItem from "../../explorer/nodes/NVItem";

import CVTask from "./CVTask";
import CaptureTaskView from "../ui/CaptureTaskView";

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
    };

    protected static readonly outs = {
        ready: types.Boolean("Picture.Ready"),
    };

    ins = this.addInputs<CVTask, typeof CVCaptureTask.ins>(CVCaptureTask.ins);
    outs = this.addOutputs<CVTask, typeof CVCaptureTask.outs>(CVCaptureTask.outs);

    protected get renderer() {
        return this.getMainComponent(CRenderer);
    }

    private _imageDataURIs: Dictionary<string> = {};
    private _imageElements: Dictionary<HTMLImageElement> = {};
    private _mimeType: string = "";
    private _extension: string = "";


    getImageElement(quality: EDerivativeQuality = EDerivativeQuality.Low)
    {
        return this._imageElements[quality];
    }

    arePicturesReady()
    {
        return this.outs.ready.value;
    }

    createView()
    {
        return new CaptureTaskView(this);
    }

    activateTask()
    {
        this.selectionController.selectedComponents.on(CVModel_old, this.onSelectModel, this);

        super.activateTask();
    }

    deactivateTask()
    {
        super.deactivateTask();

        this.selectionController.selectedComponents.off(CVModel_old, this.onSelectModel, this);
    }

    create()
    {
        super.create();

        const configuration = this.configuration;
        configuration.interfaceVisible = false;
        configuration.annotationsVisible = false;
        configuration.bracketsVisible = false;
        configuration.gridVisible = false;
    }

    update()
    {
        const ins = this.ins;

        if (ins.take.changed) {
            const typeIndex = ins.type.getValidatedValue();
            this.takePictures(ins.quality.value, _mimeTypes[typeIndex], _typeExtensions[typeIndex]);
        }
        if (ins.save.changed) {
            this.uploadPictures();
        }
        if (ins.download.changed) {
            this.downloadPicture();
        }
        if (ins.remove.changed) {
            this.removePictures();
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

    protected uploadPictures()
    {
        const model = this.activeItem.model;
        if (!model || !this.arePicturesReady()) {
            return;
        }

        _qualityLevels.forEach(quality => {
            const dataURI = this._imageDataURIs[quality];
            const fileName = this.getImageFileName(quality, this._extension);
            const fileURL = this.activeItem.getAssetUrl(fileName);
            const blob = convert.dataURItoBlob(dataURI);
            const file = new File([blob], fileName);

            fetch.file(fileURL, "PUT", file)
            .then(() => {
                this.updateDerivative(quality, this._mimeType, fileName);
                new Notification(`Successfully uploaded image to '${fileURL}'`, "info", 4000);
            })
            .catch(e => {
                new Notification(`Failed to upload image to '${fileURL}'`, "error", 8000);
            });

        });
    }

    protected downloadPicture()
    {
        if (!this.arePicturesReady()) {
            return;
        }

        const dataURI = this._imageDataURIs[EDerivativeQuality.High];
        const fileName = this.getImageFileName(EDerivativeQuality.High, this._extension);
        download.url(dataURI, fileName);
    }

    protected updateDerivative(quality: EDerivativeQuality, mimeType: string, url: string)
    {
        if (!this.arePicturesReady()) {
            return;
        }

        const model = this.activeItem.model;

        const derivative = model.derivatives.getOrCreate(EDerivativeUsage.Web2D, quality);

        const asset = derivative.findAsset(EAssetType.Image)
            || derivative.createAsset(EAssetType.Image, url);

        asset.uri = url;
        asset.imageSize = Math.max(_sizePresets[quality][0], _sizePresets[quality][1]);
        asset.mimeType = mimeType;
        asset.byteSize = Math.ceil(this._imageDataURIs[quality].length / 4 * 3);
    }

    protected getImageFileName(quality: EDerivativeQuality, extension: string)
    {
        const assetBaseName = this.activeItem.assetBaseName;
        const qualityName = EDerivativeQuality[quality].toLowerCase();
        const imageName = `image-${qualityName}.${extension}`;
        return assetBaseName + imageName;
    }

    protected removePictures()
    {
        console.warn("CCaptureTask.removePictures - not implemented yet");
    }

    protected onActiveItem(previous: NVItem, next: NVItem)
    {
        super.onActiveItem(previous, next);

        if (previous && previous.hasComponent(CVModel_old)) {
            this.outs.ready.setValue(false);
            this._imageElements = {};
            this._imageDataURIs = {};
        }

        if (next && next.hasComponent(CVModel_old)) {
            const model = next.model;
            // load existing captures
            _qualityLevels.forEach(quality => {
                const derivative = model.derivatives.get(EDerivativeUsage.Web2D, quality);
                if (derivative) {
                    const image = derivative.findAsset(EAssetType.Image);
                    if (image) {
                        const imageElement = document.createElement("img");
                        imageElement.src = this.activeItem.getAssetUrl(image.uri);
                        this._imageElements[quality] = imageElement;
                    }
                }
            });

            this.selectionController.selectComponent(model);
        }
    }

    protected onSelectModel(event: IComponentEvent<CVModel_old>)
    {
        const node = event.object.node;

        if (event.add && node instanceof NVItem) {
            this.itemManager.activeItem = node;
        }
    }
}