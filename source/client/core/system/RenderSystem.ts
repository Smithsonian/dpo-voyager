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

import RenderContext, { IRenderable } from "./RenderContext";

////////////////////////////////////////////////////////////////////////////////

export default class RenderSystem extends System
{
    protected renderables: IRenderable[] = [];

    render(context: RenderContext)
    {
        const renderables = this.renderables;
        for (let i = 0, n = renderables.length; i < n; ++i) {
            renderables[i].render(context);
        }
    }

    protected didAddComponent(component: IRenderable)
    {
        if (component.render) {
            this.renderables.push(component);
        }
    }

    protected willRemoveComponent(component: IRenderable)
    {
        const index = this.renderables.indexOf(component);
        if (index >= 0) {
            this.renderables.splice(index, 1);
        }
    }
}