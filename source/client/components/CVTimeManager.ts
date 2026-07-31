/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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

import Component, { IComponentEvent } from "@ff/graph/Component";
import CVSunLight from "./lights/CVSunLight";
var tzlookup = require("@photostructure/tz-lookup");

////////////////////////////////////////////////////////////////////////////////


/**
 * Component that manages time localization
 */
export default class CVTimeManager extends Component
{
    static readonly typeName: string = "CVTimeManager";

    static readonly text: string = "TimeManager";
    static readonly icon: string = "";

    create()
    {
        super.create();
        this.system.components.on(CVSunLight, this.onSunComponent, this);
    }

    protected onSunComponent(event: IComponentEvent<CVSunLight>)
    {
        const component = event.object;

        if (event.add) {
            component.ins.latitude.on("value", () => this.onLatLongChanged(component), this);
            component.ins.longitude.on("value", () => this.onLatLongChanged(component), this);
        }
        else if (event.remove) {
            component.ins.latitude.off("value", () => this.onLatLongChanged(component), this);
            component.ins.longitude.off("value", () => this.onLatLongChanged(component), this);
        }
    }

    protected onLatLongChanged(light: CVSunLight) {
        light.ins.timezone.setValue(tzlookup(light.ins.latitude.value, light.ins.longitude.value), true);
    }
}