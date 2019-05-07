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

import { Dictionary } from "@ff/core/types";
import Component from "@ff/graph/Component";
import CTweenMachine, { EEasingCurve } from "@ff/graph/components/CTweenMachine";
import CLight from "@ff/scene/components/CLight";

import { ISnapshots } from "client/schema/setup";

import CVSetup from "./CVSetup";
import CVModel2 from "./CVModel2";
import Property from "@ff/graph/Property";

////////////////////////////////////////////////////////////////////////////////

export { EEasingCurve };

export default class CVSnapshots extends CTweenMachine
{
    static readonly typeName: string = "CVSnapshots";

    targetFeatures: Dictionary<boolean> = {};

    create()
    {
        super.create();

        const setup = this.getGraphComponent(CVSetup);

        Object.keys(setup.featureMap).forEach(name => {
            this.targetFeatures[name] = false;
        });

        this.targetFeatures["models"] = false;
        this.targetFeatures["lights"] = false;

        this.initializeTargetFeatures();
    }

    initializeTargetFeatures()
    {
        const features = this.targetFeatures;
        Object.keys(features).forEach(key => features[key] = false);
        features["navigation"] = true;
        features["reader"] = true;

        this.updateTargets();
    }

    updateTargets()
    {
        const features = this.targetFeatures;
        const setup = this.getGraphComponent(CVSetup);

        Object.keys(features).forEach(name => {
            const component = setup[name];
            const shouldInclude = features[name];

            if (component) {
                this.updateComponentTarget(component, shouldInclude);
            }
        });

        const models = this.getGraphComponents(CVModel2);
        models.forEach(model => this.updateComponentTarget(model.transform, !!features["models"]));

        const lights = this.getGraphComponents(CLight);
        lights.forEach(light => this.updateComponentTarget(light, !!features["lights"]));

        /*
        this.targets.forEach((target, index) => {
            const component = target.property.group.linkable as Component;
            console.log("CVSnapshot.updateTargets - target #%s, component: %s, property: %s",
                index, component.displayName, target.property.path);
        });
         */
    }

    protected updateComponentTarget(component: Component, include: boolean)
    {
        const snapshotProperties = component["snapshotProperties"] as Property[];
        if (!snapshotProperties) {
            return;
        }

        snapshotProperties.forEach(property => {
            const schema = property.schema;
            if (!schema.event && property.type !== "object") {
                const isIncluded = this.hasTargetProperty(property);
                if (include && !isIncluded) {
                    this.addTargetProperty(property);
                }
                else if (!include && isIncluded) {
                    this.removeTargetProperty(property);
                }
            }
        });
    }

    fromData(data: ISnapshots, pathMap: Map<string, Component>)
    {
        this.clear();

        const features = this.targetFeatures;
        const keys = Object.keys(features);

        if (data.features) {
            keys.forEach(key => features[key] = data.features.indexOf(key) >= 0);
        }
        else {
            this.initializeTargetFeatures();
        }

        const missingTargets = new Set<number>();

        data.targets.forEach((target, index) => {
            const slashIndex = target.lastIndexOf("/");
            const componentPath = target.substr(0, slashIndex);
            const propertyKey = target.substr(slashIndex + 1);

            const component = pathMap.get(componentPath);
            const property = component ? component.ins[propertyKey] : null;

            if (!property) {
                console.warn(`missing snapshot target property for '${target}'`);
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
        const features = this.targetFeatures;

        const data: ISnapshots = {
            features: Object.keys(features).filter(key => features[key]),

            targets: this.targets.map(target => {
                const component = target.property.group.linkable as Component;
                const key = target.property.key;
                const componentPath = pathMap.get(component);
                if (!componentPath) {
                    //Array.from(pathMap).forEach(entry => console.log(entry[1], entry[0].displayName));
                    throw new Error(`snapshot path not registered for component '${component.displayName}'`);
                }
                return componentPath + "/" + key;
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