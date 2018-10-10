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

import Component from "@ff/core/ecs/Component";
import { ISystemComponentEvent } from "@ff/core/ecs/System";

import CameraComponent from "./Camera";

////////////////////////////////////////////////////////////////////////////////

export default class MainCamera extends Component
{
    static readonly type: string = "CameraSelector";

    protected cameras: Dictionary<CameraComponent> = {};
    protected activeId: string = "";

    create()
    {
        this.system.getComponents(CameraComponent).forEach(
            cameraComponent => this.cameras[cameraComponent.id] = cameraComponent
        );

        const firstCamera = this.system.getComponent(CameraComponent);
        this.activeId = firstCamera ? firstCamera.id : "";

        this.system.addComponentEventListener(CameraComponent, this.onCamera, this);
    }

    destroy()
    {
        this.system.removeComponentEventListener(CameraComponent, this.onCamera, this);
    }

    get activeCameraComponent(): CameraComponent | null
    {
        return this.cameras[this.activeId] || null;
    }

    get activeCamera(): THREE.Camera | null
    {
        if (this.activeId) {
            return this.cameras[this.activeId].camera;
        }

        return null;
    }

    protected onCamera(event: ISystemComponentEvent<CameraComponent>)
    {
        if (event.add) {
            this.cameras[event.component.id] = event.component;
            if (!this.activeId) {
                this.activeId = event.component.id;
            }
        }
        else if (event.remove) {
            delete this.cameras[event.component.id];

            if (event.component.id === this.activeId) {
                const firstCamera = this.system.getComponent(CameraComponent);
                this.activeId = firstCamera ? firstCamera.id : "";
            }
        }
    }
}