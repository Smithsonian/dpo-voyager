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

import "@ff/ui/Splitter";
import { ISplitterChangeEvent } from "@ff/ui/Splitter";

import { EQuadViewLayout } from "@ff/three/ecs/RenderQuadView";

import CustomElement, { customElement, html, property } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

export { EQuadViewLayout };

export interface IQuadSplitterChangeMessage
{
    layout: EQuadViewLayout;
    horizontalSplit: number;
    verticalSplit: number;
    isDragging: boolean;
}

@customElement("sv-quad-splitter")
export default class QuadSplitter extends CustomElement
{
    @property({ attribute: false })
    layout: EQuadViewLayout = EQuadViewLayout.Single;

    @property({ attribute: false })
    horizontalPosition = 0.5;

    @property({ attribute: false })
    verticalPosition = 0.5;

    onChange: (message: IQuadSplitterChangeMessage) => void;

    constructor()
    {
        super();
    }

    protected render()
    {
        const layout = this.layout;

        if (layout === EQuadViewLayout.Single) {
            return;
        }

        const elements = [];

        if (layout === EQuadViewLayout.HorizontalSplit || layout === EQuadViewLayout.Quad) {
            elements.push(html`
                <div class="sv-horizontal" style="position:absolute; top:0; bottom:0; left:0; right:0; display:flex;">
                    <div class="sv-left" style="flex:1 1;"></div>
                    <ff-splitter direction="horizontal" position=${this.horizontalPosition} @ff-splitter-change=${this.onSplitterChange}></ff-splitter>
                    <div style="flex:1 1;"></div>
                </div>
            `);
        }

        if (layout === EQuadViewLayout.VerticalSplit || layout === EQuadViewLayout.Quad) {
            elements.push(html`
                <div class="sv-vertical" style="position:absolute; top:0; bottom:0; left:0; right:0; display:flex; flex-direction: column">
                    <div class="sv-top" style="flex:1 1;"></div>
                    <ff-splitter direction="vertical" position=${this.verticalPosition} @ff-splitter-change=${this.onSplitterChange}></ff-splitter>
                    <div style="flex:1 1;"></div>
                </div>
            `);
        }

        return html`${elements}`;
    }

    protected onSplitterChange(event: ISplitterChangeEvent)
    {
        if (event.detail.direction === "horizontal") {
            this.horizontalPosition = event.detail.position;
        }
        else {
            this.verticalPosition = event.detail.position;
        }

        if (this.onChange) {
            this.onChange({
                layout: this.layout,
                horizontalSplit: this.horizontalPosition,
                verticalSplit: this.verticalPosition,
                isDragging: event.detail.isDragging
            });
        }
    }
}