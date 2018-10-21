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

import Component, { ComponentType } from "@ff/core/ecs/Component";

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
            setInputValue: commander.register({
                name: "Set Value", do: this.setInputValue, target: this
            })
        };

        this.actions = actions;
        return actions;
    }

    addInputListener(componentType: ComponentType, path: string, callback: (value: any) => void, context?: any)
    {
        this.getSafeComponent(componentType).in(path).on("value", callback, context);
    }

    removeInputListener(componentType: ComponentType, path: string, callback: (value: any) => void, context?: any)
    {
        this.getSafeComponent(componentType).in(path).off("value", callback, context);
    }

    addOutputListener(componentType: ComponentType, path: string, callback: (value: any) => void, context?: any)
    {
        this.getSafeComponent(componentType).out(path).on("value", callback, context);
    }

    removeOutputListener(componentType: ComponentType, path: string, callback: (value: any) => void, context?: any)
    {
        this.getSafeComponent(componentType).out(path).off("value", callback, context);
    }

    getInputValue(componentType: ComponentType, path: string)
    {
        return this.getSafeComponent(componentType).in(path).value
    }

    getOutputValue(componentType: ComponentType, path: string)
    {
        return this.getSafeComponent(componentType).out(path).value;
    }

    protected setInputValue(componentType: ComponentType, path: string, value: any)
    {
        this.getSafeComponent(componentType).in(path).setValue(value);
    }

    protected getSafeComponent(componentType: ComponentType): Component
    {
        const component = this.getComponent(componentType);
        if (!component) {
            throw new Error(`SystemController, component type not found: ${componentType}`);
        }

        return component;
    }
}