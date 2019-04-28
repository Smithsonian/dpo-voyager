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

import SystemView, { customElement, html } from "@ff/scene/ui/SystemView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-console-panel")
export default class ConsolePanel extends SystemView
{
    protected entries: string[] = [];
    protected logFunction: (...args: any[]) => void = null;

    protected firstConnected()
    {
        this.classList.add("sv-scrollable", "sv-panel", "sv-console-panel");
    }

    protected connected()
    {
        // this.logFunction = console.log;
        // console.log = (...args) => {
        //     const text = args.map(arg => String(arg)).join(" ");
        //     this.entries.push(text);
        //     if (this.entries.length > 100) {
        //         this.entries.shift();
        //     }
        //
        //     this.requestUpdate();
        //     this.logFunction.apply(console, args);
        // }
    }

    protected disconnected()
    {
        //console.log = this.logFunction;
    }

    protected render()
    {
        return html`<div>${this.entries.map(entry => html`<div>${entry}</div>`)}</div>`;
    }
}