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

import Component from "@ff/core/ecs/Component";

import Controller, { Actions, Commander } from "./Controller";

////////////////////////////////////////////////////////////////////////////////

export type SystemActions = Actions<SystemController>;

export default class SystemController extends Controller<SystemController>
{
    static readonly type: string = "SystemController";

    actions: SystemActions = null;

    create()
    {
        super.create();
    }

    createActions(commander: Commander)
    {
        const actions = {
            setValue: commander.register({
                name: "Set Value", do: this.setComponentValue, target: this
            })
        };

        this.actions = actions;
        return actions;
    }

    protected setComponentValue(component: Component, path: string, value: any)
    {
        component.setValue(path, value);
    }
}