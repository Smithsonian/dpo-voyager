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

import { IComponentEvent } from "@ff/graph/Component";
import CRenderable, { types } from "@ff/scene/components/CRenderable";

import { EShaderMode, IViewer, TShaderMode } from "client/schema/setup";
import { EDerivativeQuality } from "client/schema/model";

import CVModel2 from "./CVModel2";
import CVAnnotationView from "./CVAnnotationView";
import CVAnalytics from "./CVAnalytics";

////////////////////////////////////////////////////////////////////////////////

export default class CVViewer extends CRenderable
{
    static readonly typeName: string = "CVViewer";

    static readonly text: string = "Viewer";
    static readonly icon: string = "";

    protected static readonly ins = {
        shader: types.Enum("Renderer.Shader", EShaderMode),
        exposure: types.Number("Renderer.Exposure", 1),
        gamma: types.Number("Renderer.Gamma", 1),
        quality: types.Enum("Models.Quality", EDerivativeQuality, EDerivativeQuality.High),
        annotationsVisible: types.Boolean("Annotations.Visible"),
    };

    ins = this.addInputs(CVViewer.ins);

    get settingProperties() {
        return [
            this.ins.shader,
            this.ins.exposure,
            this.ins.annotationsVisible,
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.shader,
            this.ins.exposure,
            this.ins.annotationsVisible,
        ];
    }

    protected get analytics() {
        return this.getMainComponent(CVAnalytics);
    }

    create()
    {
        super.create();
        this.graph.components.on(CVAnnotationView, this.onAnnotationsComponent, this);
    }

    dispose()
    {
        this.graph.components.off(CVAnnotationView, this.onAnnotationsComponent, this);
        super.dispose();
    }

    update(context)
    {
        const ins = this.ins;

        if (ins.shader.changed) {
            const shader = ins.shader.getValidatedValue();
            this.getGraphComponents(CVModel2).forEach(model => model.ins.shader.setValue(shader));
        }
        if (ins.quality.changed) {
            const quality = ins.quality.getValidatedValue();
            this.getGraphComponents(CVModel2).forEach(model => model.ins.quality.setValue(quality));
        }
        if (ins.annotationsVisible.changed) {
            const visible = ins.annotationsVisible.value;
            this.getGraphComponents(CVAnnotationView).forEach(view => view.ins.visible.setValue(visible));

            this.analytics.sendProperty("Annotations.Visible", ins.annotationsVisible.value);
        }

        return true;
    }

    preRender(context)
    {
        if (this.updated) {
            context.renderer.toneMappingExposure = this.ins.exposure.value;

            //const qualityName = this.ins.quality.getOptionText();
            //context.viewport.overlay.setLabel(ELocation.BottomRight, "quality", `Quality: ${qualityName}`);
        }
    }

    fromData(data: IViewer)
    {
        this.ins.copyValues({
            shader: EShaderMode[data.shader] || EShaderMode.Default,
            exposure: data.exposure !== undefined ? data.exposure : 1,
            gamma: data.gamma !== undefined ? data.gamma : 1,
            annotationsVisible: !!data.annotationsVisible,
        });
    }

    toData(): IViewer
    {
        const ins = this.ins;

        return {
            shader: EShaderMode[ins.shader.value] as TShaderMode,
            exposure: ins.exposure.value,
            gamma: ins.gamma.value,
            annotationsVisible: ins.annotationsVisible.value,
        };
    }

    protected onAnnotationsComponent(event: IComponentEvent<CVAnnotationView>)
    {
        if (event.add) {
            event.object.ins.visible.setValue(this.ins.annotationsVisible.value);
        }
    }
}