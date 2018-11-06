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

import System from "@ff/core/ecs/System";
import Component from "@ff/core/ecs/Component";

import RenderContext from "./RenderContext";

////////////////////////////////////////////////////////////////////////////////

export interface IRenderable extends Component
{
    preRender?: (context: RenderContext) => void;
    postRender?: (context: RenderContext) => void;
}

export default class RenderSystem extends System
{
    protected preRenderList: IRenderable[] = [];
    protected postRenderList: IRenderable[] = [];

    preRender(context: RenderContext)
    {
        const renderables = this.preRenderList;
        for (let i = 0, n = renderables.length; i < n; ++i) {
            renderables[i].preRender(context);
        }
    }

    postRender(context: RenderContext)
    {
        const renderables = this.postRenderList;
        for (let i = 0, n = renderables.length; i < n; ++i) {
            renderables[i].postRender(context);
        }
    }

    protected didAddComponent(component: IRenderable)
    {
        if (component.preRender) {
            this.preRenderList.push(component);
        }
        if (component.postRender) {
            this.postRenderList.push(component);
        }
    }

    protected willRemoveComponent(component: IRenderable)
    {
        let index = this.preRenderList.indexOf(component);
        if (index >= 0) {
            this.preRenderList.splice(index, 1);
        }

        index = this.postRenderList.indexOf(component);
        if (index >= 0) {
            this.postRenderList.splice(index, 1);
        }
    }
}