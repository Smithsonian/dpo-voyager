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

import fetch from "@ff/browser/fetch";
import { types } from "@ff/graph/Component";
import { IComponentEvent } from "@ff/graph/ComponentSet";

import Notification from "@ff/ui/Notification";
import CRenderer from "@ff/scene/components/CRenderer";

import Derivative, { EAssetType, EDerivativeQuality, EDerivativeUsage } from "../../core/models/Derivative";

import CModel from "../../core/components/CModel";
import CInterface from "../../explorer/components/CInterface";
import CPresentation from "../../explorer/components/CPresentation";
import NItem from "../../explorer/nodes/NItem";

import CaptureTaskView from "../ui/CaptureTaskView";
import CTask from "./CTask";

////////////////////////////////////////////////////////////////////////////////

export enum ECaptureQuality {
    Thumb = EDerivativeQuality.Thumb,
    Low = EDerivativeQuality.Low,
    Medium = EDerivativeQuality.Medium,
    High = EDerivativeQuality.High
}

const _qualityTags = {
    [EDerivativeQuality.Thumb]:  "thumb",
    [EDerivativeQuality.Low]:    "low",
    [EDerivativeQuality.Medium]: "medium",
    [EDerivativeQuality.High]:   "high",
};

const _sizePresets = {
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

const ins = {
    preset: types.Enum("Derivative.Quality", ECaptureQuality, ECaptureQuality.Thumb),
    take: types.Event("Picture.Take"),
    upload: types.Event("Picture.Upload"),
    download: types.Event("Picture.Download"),
    remove: types.Event("Picture.Remove"),
    size: types.IntVec2("Picture.Size", _sizePresets[ECaptureQuality.Thumb].slice()),
    type: types.Enum("Picture.Type", EFileType),
    quality: types.Number("Picture.Quality", { min: 0, max: 1, preset: 0.85 }),
};

const outs = {
    ready: types.Boolean("Picture.Ready")
};

export default class CCaptureTask extends CTask
{
    static readonly type: string = "CCaptureTask";

    static readonly text: string = "Capture";
    static readonly icon: string = "camera";

    ins = this.addInputs<CTask, typeof ins>(ins);
    outs = this.addOutputs(outs);


    protected get interface() {
        return this.system.components.get(CInterface);
    }
    protected get renderer() {
        return this.system.components.get(CRenderer);
    }

    protected activeModel: CModel = null;

    private _interfaceVisible = false;
    private _gridVisible = false;
    private _bracketsVisible = false;

    private _imageDataURLs: string[] = [];
    private _imageElements: HTMLImageElement[] = [];
    private _mimeType: string = "";
    private _extension: string = "";


    getImageElement(quality: ECaptureQuality = ECaptureQuality.Thumb)
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

    activate()
    {
        super.activate();

        this.selection.selectedComponents.on(CModel, this.onSelectModel, this);

        this._bracketsVisible = this.selection.ins.bracketsVisible.value;
        this.selection.ins.bracketsVisible.setValue(false);

        const interface_ = this.interface;
        if (interface_) {
            this._interfaceVisible = interface_.ins.visible.value;
            interface_.ins.visible.setValue(false);
        }
    }

    deactivate()
    {
        super.deactivate();

        this.selection.selectedComponents.off(CModel, this.onSelectModel, this);

        this.selection.ins.bracketsVisible.setValue(this._bracketsVisible);

        const interface_ = this.interface;
        if (interface_) {
            interface_.ins.visible.setValue(this._interfaceVisible);
        }
    }

    update()
    {
        const ins = this.ins;

        const index = ins.preset.getValidatedValue();

        if (ins.size.changed) {
            _sizePresets[index] = ins.size.cloneValue();
        }
        else if (ins.preset.changed) {
            ins.size.copyValue(_sizePresets[index]);
        }

        if (ins.take.changed) {
            this._mimeType = _mimeTypes[ins.type.getValidatedValue()];
            this._extension = _typeExtensions[ins.type.getValidatedValue()];
            this.takePictures(ins.quality.value);
        }
        if (ins.upload.changed) {
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

    protected takePictures(quality: number)
    {
        const view = this.renderer.views[0];
        if (!view) {
            console.warn("can't render to image, no view attached");
            return;
        }

        for (let i = 0; i < 4; ++i) {
            this._imageDataURLs[i] = view.renderImage(_sizePresets[i][0], _sizePresets[i][1], this._mimeType, quality);
            this._imageElements[i] = document.createElement("img");
            this._imageElements[i].src = this._imageDataURLs[i];
        }

        this.outs.ready.setValue(true);
    }

    protected uploadPictures()
    {
        const model = this.activeModel;
        if (!model || !this.arePicturesReady()) {
            return;
        }

        for (let quality = 0; quality < 4; ++quality) {

            const dataURL = this._imageDataURLs[quality];
            const fileName = this.getImageFileName(quality, this._extension);
            const fileURL = model.assetPath + fileName;
            const file = new File([ dataURL ], fileName, { type: this._mimeType });

            fetch.file(fileURL, "PUT", file)
                .then(() => {
                    this.updateDerivative(quality, this._mimeType, fileName);
                    new Notification(`Successfully uploaded image to '${fileURL}'`, "info", 4000);
                })
                .catch(e => {
                    new Notification(`Failed to upload image to '${fileURL}'`, "error", 8000);
                });
        }
    }

    protected downloadPicture()
    {
        if (!this.arePicturesReady()) {
            return;
        }

        const dataURL = this._imageDataURLs[EDerivativeQuality.High];
        const fileName = this.getImageFileName(EDerivativeQuality.High, this._extension);

        const link = document.createElement("a");
        link.download = fileName;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    protected updateDerivative(quality: EDerivativeQuality, mimeType: string, url: string)
    {
        if (!this.arePicturesReady()) {
            return;
        }

        const model = this.activeModel;

        const derivative = model.getDerivative(EDerivativeUsage.Web, quality)
            || model.createDerivative(EDerivativeUsage.Web, quality);

        const asset = derivative.findAsset(EAssetType.Image)
            || derivative.createAsset(EAssetType.Image, url);

        asset.uri = url;
        asset.imageSize = Math.max(_sizePresets[quality][0], _sizePresets[quality][1]);
        asset.mimeType = mimeType;
        asset.byteSize = Math.ceil(this._imageDataURLs[quality].length / 4 * 3);

        console.log("derivative", derivative);
    }

    protected getImageFileName(quality: EDerivativeQuality, extension: string)
    {
        return `image-${_qualityTags[quality]}.${extension}`;
    }

    protected removePictures()
    {
        console.warn("CCaptureTask.removePictures - not implemented yet");
    }

    protected setActivePresentation(presentation: CPresentation)
    {
        const previous = this.activePresentation;

        if (previous) {
            previous.setup.homeGrid.ins.visible.setValue(this._gridVisible);
        }
        if (presentation) {
            this._gridVisible = presentation.setup.homeGrid.ins.visible.value;
            presentation.setup.homeGrid.ins.visible.setValue(false);
        }
    }

    protected setActiveItem(item: NItem)
    {
        if (item && item.model) {
            this.activeModel = item.model;
            this.selection.selectComponent(this.activeModel);
        }
        else {
            this.outs.ready.setValue(false);
            this.activeModel = null;
            this._imageElements = [];
            this._imageDataURLs = [];
        }
    }

    protected onSelectModel(event: IComponentEvent<CModel>)
    {
        if (event.add && event.component.node instanceof NItem) {
            this.presentations.activeItem = event.component.node;
        }
    }
}