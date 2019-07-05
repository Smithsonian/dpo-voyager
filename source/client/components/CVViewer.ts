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
import CVAnnotationView, { ITagUpdateEvent } from "./CVAnnotationView";
import CVAnalytics from "./CVAnalytics";

////////////////////////////////////////////////////////////////////////////////

export default class CVViewer extends CRenderable
{
    static readonly typeName: string = "CVViewer";

    static readonly text: string = "Viewer";
    static readonly icon: string = "";

    protected static readonly ins = {
        activeTags: types.String("Tags.Active"),
        radioTags: types.Boolean("Tags.Radio"),
        shader: types.Enum("Renderer.Shader", EShaderMode),
        exposure: types.Number("Renderer.Exposure", 1),
        gamma: types.Number("Renderer.Gamma", 1),
        quality: types.Enum("Models.Quality", EDerivativeQuality, EDerivativeQuality.High),
        annotationsVisible: types.Boolean("Annotations.Visible"),
    };

    protected static readonly outs = {
        tagCloud: types.String("Tags.Cloud"),
    };

    ins = this.addInputs(CVViewer.ins);
    outs = this.addOutputs(CVViewer.outs);

    get settingProperties() {
        return [
            this.ins.shader,
            this.ins.exposure,
            this.ins.annotationsVisible,
            this.ins.activeTags,
            this.ins.radioTags,
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.shader,
            this.ins.exposure,
            this.ins.annotationsVisible,
            this.ins.activeTags,
        ];
    }

    protected get analytics() {
        return this.getMainComponent(CVAnalytics);
    }

    create()
    {
        super.create();
        this.graph.components.on(CVModel2, this.onModelComponent, this);
        this.graph.components.on(CVAnnotationView, this.onAnnotationsComponent, this);
    }

    dispose()
    {
        this.graph.components.off(CVModel2, this.onModelComponent, this);
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
        if (ins.activeTags.changed) {
            const tags = ins.activeTags.value;
            this.getGraphComponents(CVAnnotationView).forEach(view => view.ins.activeTags.setValue(tags));
            this.getGraphComponents(CVModel2).forEach(model => model.ins.activeTags.setValue(tags));
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
            activeTags: data.activeTags || "",
            radioTags: data.radioTags || false,
        });
    }

    toData(): IViewer
    {
        const ins = this.ins;

        const data: Partial<IViewer> = {
            shader: EShaderMode[ins.shader.value] as TShaderMode,
            exposure: ins.exposure.value,
            gamma: ins.gamma.value,
        };

        if (ins.annotationsVisible.value) {
            data.annotationsVisible = true;
        }
        if (ins.activeTags.value) {
            data.activeTags = ins.activeTags.value;
        }
        if (ins.radioTags.value) {
            data.radioTags = ins.radioTags.value;
        }

        return data as IViewer;
    }

    protected refreshTagCloud()
    {
        const tagCloud = new Set<string>();

        const models = this.getGraphComponents(CVModel2);
        models.forEach(model => {
            const tags = model.ins.tags.value.split(",").map(tag => tag.trim()).filter(tag => tag);
            tags.forEach(tag => tagCloud.add(tag));
        });

        const views = this.getGraphComponents(CVAnnotationView);
        views.forEach(component => {
            const annotations = component.getAnnotations();
            annotations.forEach(annotation => {
                const tags = annotation.data.tags;
                tags.forEach(tag => tagCloud.add(tag));
            });
        });

        const tagArray = Array.from(tagCloud);
        this.outs.tagCloud.setValue(tagArray.join(", "));

        if (ENV_DEVELOPMENT) {
            console.log("CVViewer.refreshTagCloud - %s", tagArray.join(", "));
        }
    }

    protected onModelComponent(event: IComponentEvent<CVModel2>)
    {
        const component = event.object;

        if (event.add) {
            component.on<ITagUpdateEvent>("tag-update", this.refreshTagCloud, this);
        }
        else if (event.remove) {
            component.off<ITagUpdateEvent>("tag-update", this.refreshTagCloud, this);
        }
    }

    protected onAnnotationsComponent(event: IComponentEvent<CVAnnotationView>)
    {
        const component = event.object;

        if (event.add) {
            component.on<ITagUpdateEvent>("tag-update", this.refreshTagCloud, this);
            component.ins.visible.setValue(this.ins.annotationsVisible.value);
        }
        else if (event.remove) {
            component.off<ITagUpdateEvent>("tag-update", this.refreshTagCloud, this);
        }
    }
}