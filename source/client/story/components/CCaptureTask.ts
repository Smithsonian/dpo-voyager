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

import * as THREE from "three";

import { types } from "@ff/graph/Component";
import { INodeEvent } from "@ff/graph/NodeSet";

import CRenderer from "@ff/scene/components/CRenderer";

import CInterface from "../../explorer/components/CInterface";
import CPresentation from "../../explorer/components/CPresentation";
import NItem from "../../explorer/nodes/NItem";

import CaptureTaskView from "../ui/CaptureTaskView";
import CTask from "./CTask";

////////////////////////////////////////////////////////////////////////////////

const _presets = [
    { width: 480, height: 480 },
    { width: 800, height: 800 },
    { width: 1600, height: 1600 }
];

export enum ECapturePreset { Thumbnail, Medium, Large, Custom }

const ins = {
    take: types.Event("Picture.Take"),
    save: types.Event("Picture.Save"),
    preset: types.Enum("Picture.Preset", ECapturePreset, ECapturePreset.Thumbnail),
    width: types.Integer("Picture.Width", 800),
    height: types.Integer("Picture.Height", 800)
};

const outs = {
    taken: types.Event("Picture.Taken")
};

export default class CCaptureTask extends CTask
{
    static readonly type: string = "CCaptureTask";

    static readonly text: string = "Capture";
    static readonly icon: string = "camera";

    ins = this.addInputs<CTask, typeof ins>(ins);
    outs = this.addOutputs(outs);

    get imageDataURL() {
        return this._dataURL;
    }

    protected get interface() {
        return this.system.components.get(CInterface);
    }
    protected get renderer() {
        return this.system.components.get(CRenderer);
    }

    private _interfaceVisible = false;
    private _gridVisible = false;
    private _bracketsVisible = false;
    private _dataURL = "";

    createView()
    {
        return new CaptureTaskView(this);
    }

    capture()
    {
        const view = this.renderer.views[0];
        if (!view) {
            console.warn("can't render to image, no view attached");
            return;
        }

        this._dataURL = view.renderImage(this.ins.width.value, this.ins.height.value, "image/jpeg", 0.9);
        this.outs.taken.set();
    }

    save()
    {
        console.log("Save!");
    }

    activate()
    {
        super.activate();

        this.selection.selectedNodes.on(NItem, this.onSelectItem, this);

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

        this.selection.selectedNodes.on(NItem, this.onSelectItem, this);

        this.selection.ins.bracketsVisible.setValue(this._bracketsVisible);

        const interface_ = this.interface;
        if (interface_) {
            interface_.ins.visible.setValue(this._interfaceVisible);
        }
    }

    update()
    {
        const ins = this.ins;

        if (ins.width.changed || ins.height.changed) {
            ins.preset.setValue(ECapturePreset.Custom);
        }
        else if (ins.preset.changed) {
            const index = ins.preset.getValidatedValue();
            if (index !== ECapturePreset.Custom) {
                const preset = _presets[index];
                ins.width.setValue(preset.width);
                ins.height.setValue(preset.height);
            }
        }

        if (ins.take.changed) {
            this.capture();
        }

        return true;
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
        if (item) {
            this.selection.selectNode(item);
        }
    }

    protected onSelectItem(event: INodeEvent<NItem>)
    {
        if (event.add) {
            this.manager.activeItem = event.node;
        }
    }
}