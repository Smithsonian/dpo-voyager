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

import "@ff/ui/Button";

import CVDocument from "../../components/CVDocument";
import CVTours from "../../components/CVTours";
import CVNodeProvider from "../..//components/CVNodeProvider";
import CVTargets from "../../components/CVTargets";

import DocumentView, { customElement, html } from "./DocumentView";
import CVTargetManager from "../../components/CVTargetManager";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-target-navigator")
export default class TourNavigator extends DocumentView
{
    get nodeProvider() {
        return this.system.getMainComponent(CVNodeProvider);
    }

    protected firstConnected()
    {
        super.firstConnected();

        this.classList.add("sv-bottom-bar-container", "sv-target-navigator", "sv-transition");
        setTimeout(() => this.classList.remove("sv-transition"), 1);
    }

    protected render()
    {
        /*const tours = this.tours;
        const activeTour = tours.activeTour;

        let title, info;

        if (tours && activeTour) {
            const stepNumber = tours.outs.stepIndex.value + 1;
            const stepCount = tours.outs.stepCount.value;
            title = stepCount > 0 ? tours.outs.stepTitle.value : tours.outs.tourTitle.value;
            info = stepCount > 0 ? `Step ${stepNumber} of ${stepCount}` : "No tour steps defined";
        }
        else {
            title = "No tour selected";
            info = "---";
        }*/

        const targets = this.nodeProvider.activeNode.getComponent(CVTargets, true); 
        const title = targets.activeZone.title;

        return html`<div class="sv-blue-bar"><div class="sv-section">
            <ff-button class="sv-section-lead" transparent icon="close" title="Exit Tour" @click=${this.onClickExit}></ff-button>
            <div class="ff-ellipsis sv-content">
                <div class="ff-ellipsis sv-title">${title}</div>
            </div>
        </div></div>`;
    }

    protected onClickExit()
    {
        // exit target to return to pre-target state
        const targets = this.nodeProvider.activeNode.getComponent(CVTargets, true); 
        const manager = this.system.getComponent(CVTargetManager);
        if(targets && manager) {
            manager.ins.engaged.setValue(false);
            targets.ins.back.set();
        }

        //console.log("EXIT TARGET");
    }


    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        this.requestUpdate();
    }
}