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

import resolvePathname from "resolve-pathname";

import { Dictionary } from "@ff/core/types";

import download from "@ff/browser/download";
import fetch from "@ff/browser/fetch";
import convert from "@ff/browser/convert";

import { types, IComponentEvent } from "@ff/graph/Component";

import Notification from "@ff/ui/Notification";
import CRenderer from "@ff/scene/components/CRenderer";

import { EAssetType, EDerivativeQuality, EDerivativeUsage } from "../../core/models/Derivative";

import CVModel from "../../core/components/CVModel";
import CVInterface from "../../explorer/components/CVInterface";
import CVPresentation from "../../explorer/components/CVPresentation";
import NVItem from "../../explorer/nodes/NVItem";

import CaptureTaskView from "../ui/CaptureTaskView";
import CVTask from "./CVTask";

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

const _inputs = {
    take: types.Event("Picture.Take"),
    save: types.Event("Picture.Save"),
    download: types.Event("Picture.Download"),
    remove: types.Event("Picture.Remove"),
    type: types.Enum("Picture.Type", EFileType),
    quality: types.Number("Picture.Quality", { min: 0, max: 1, preset: 0.85 }),
};

const _outputs = {
    ready: types.Boolean("Picture.Ready")
};

export default class CVCaptureTask extends CVTask
{
    static readonly text: string = "Capture";
    static readonly icon: string = "camera";

    ins = this.addInputs<CVTask, typeof _inputs>(_inputs);
    outs = this.addOutputs<CVTask, typeof _outputs>(_outputs);


    protected get renderer() {
        return this.getMainComponent(CRenderer);
    }
    protected get interface() {
        return this.getMainComponent(CVInterface);
    }

    protected activeModel: CVModel = null;

    private _interfaceVisible = false;
    private _gridVisible = false;
    private _bracketsVisible = false;

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

    activate()
    {
        super.activate();

        this.selection.selectedComponents.on(CVModel, this.onSelectModel, this);

        // disable selection brackets
        this._bracketsVisible = this.selection.ins.viewportBrackets.value;
        this.selection.ins.viewportBrackets.setValue(false);

        // disable interface overlay
        const interface_ = this.interface;
        if (interface_) {
            this._interfaceVisible = interface_.ins.visible.value;
            interface_.ins.visible.setValue(false);
        }
    }

    deactivate()
    {
        super.deactivate();

        this.selection.selectedComponents.off(CVModel, this.onSelectModel, this);

        // restore selection brackets visibility
        this.selection.ins.viewportBrackets.setValue(this._bracketsVisible);

        // restore interface visibility
        const interface_ = this.interface;
        if (interface_) {
            interface_.ins.visible.setValue(this._interfaceVisible);
        }
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

    protected takePictures(quality: number, type: string, extension: string)
    {
        this._mimeType = type;
        this._extension = extension;

        const view = this.renderer.views[0];
        if (!view) {
            console.warn("can't render to image, no view attached");
            return;
        }

        _qualityLevels.forEach(quality => {
            const dataURI = view.renderImage(_sizePresets[quality][0], _sizePresets[quality][1], type, quality);
            this._imageDataURIs[quality] = dataURI;

            const imageElement = this._imageElements[quality] || document.createElement("img");
            imageElement.src = dataURI;
            this._imageElements[quality] = imageElement;
        });

        this.outs.ready.setValue(true);
    }

    protected uploadPictures()
    {
        const model = this.activeModel;
        if (!model || !this.arePicturesReady()) {
            return;
        }

        _qualityLevels.forEach(quality => {
            const dataURI = this._imageDataURIs[quality];
            const fileName = this.getImageFileName(quality, this._extension);
            const fileURL = model.assetPath + fileName;
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

        const model = this.activeModel;

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
        const assetBaseName = this.activeModel.assetBaseName;
        const qualityName = EDerivativeQuality[quality].toLowerCase();
        const imageName = `image-${qualityName}.${extension}`;
        return assetBaseName ? assetBaseName + "-" + imageName : imageName;
    }

    protected removePictures()
    {
        console.warn("CCaptureTask.removePictures - not implemented yet");
    }

    protected setActivePresentation(presentation: CVPresentation)
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

    protected setActiveItem(item: NVItem)
    {
        if (item && item.model) {
            this.activeModel = item.model;
            this.selection.selectComponent(this.activeModel);

            // load existing captures
            _qualityLevels.forEach(quality => {
                const derivative = item.model.derivatives.get(EDerivativeUsage.Web2D, quality);
                if (derivative) {
                    const image = derivative.findAsset(EAssetType.Image);
                    if (image) {
                        const imageElement = document.createElement("img");
                        imageElement.src = resolvePathname(image.uri, item.model.assetPath);
                        this._imageElements[quality] = imageElement;
                    }
                }
            })
        }
        else {
            this.outs.ready.setValue(false);
            this.activeModel = null;
            this._imageElements = {};
            this._imageDataURIs = {};
        }
    }

    protected onSelectModel(event: IComponentEvent<CVModel>)
    {
        if (event.add && event.object.node instanceof NVItem) {
            this.presentations.activeItem = event.object.node;
        }
    }
}