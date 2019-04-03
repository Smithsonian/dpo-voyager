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

import Component from "@ff/graph/Component";
import CTweenMachine, { EEasingCurve } from "@ff/graph/components/CTweenMachine";

import { ISnapshots } from "common/types/setup";

////////////////////////////////////////////////////////////////////////////////

export default class CVSnapshots extends CTweenMachine
{
    static readonly typeName: string = "CVSnapshots";

    fromData(data: ISnapshots, pathMap: Map<string, Component>)
    {
        this.clear();

        const missingTargets = new Set<number>();

        data.targets.forEach((target, index) => {
            const slashIndex = target.lastIndexOf("/");
            const componentPath = target.substr(0, slashIndex);
            const propertyKey = target.substr(slashIndex + 1);

            const component = pathMap[componentPath];
            const property = component ? component.ins[propertyKey] : null;

            if (!property) {
                missingTargets.add(index);
            }
            else {
                this.addTargetProperty(property);
            }
        });

        data.states.forEach(state => {
            this.setState({
                id: state.id,
                curve: state.curve !== undefined ? EEasingCurve[state.curve] : EEasingCurve.EaseQuad,
                duration: state.duration !== undefined ? state.duration : 2,
                threshold: state.threshold !== undefined ? state.threshold : 0.5,
                values: state.values.filter((value, index) => !missingTargets.has(index)),
            });
        });
    }

    toData(pathMap: Map<Component, string>): ISnapshots | null
    {
        const data: ISnapshots = {
            targets: this.targets.map(target => {
                const component = target.property.group.linkable as Component;
                const key = target.property.key;
                return pathMap.get(component) + "/" + key;
            }),
            states: Object.keys(this.states).map(key => {
                const state = this.states[key];
                const data: any = { id: state.id, values: state.values };
                if (state.curve !== EEasingCurve.EaseQuad) {
                    data.curve = EEasingCurve[state.curve];
                }
                if (state.duration !== 2) {
                    data.duration = state.duration;
                }
                if (state.threshold !== 0.5) {
                    data.threshold = state.threshold;
                }
                return data;
            }),
        };

        if (data.targets.length > 0 && data.states.length > 0) {
            return data;
        }

        return null;
    }
}