/**
 * 3D Foundation Project
 * Copyright 2021 Smithsonian Institution
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

import Popup, { customElement, html } from "@ff/ui/Popup";

import "@ff/ui/Button";
import "@ff/ui/TextEdit";
import Component from "@ff/graph/Component";

import CVLanguageManager from "client/components/CVLanguageManager";
import { CLight } from "client/components/CVLight";
import { lightTypes } from "client/applications/coreTypes";

////////////////////////////////////////////////////////////////////////////////


const nodeTypes :Array<typeof Component> =[
  ...lightTypes
];


@customElement("sv-addnode-menu")
export default class AddNodeMenu extends Popup
{
    protected language: CVLanguageManager = null;
    protected errorString: string = "";
    protected selectIndex :number = -1;
    protected name :string = "";

    static show(parent: HTMLElement, language: CVLanguageManager): Promise<[string, typeof Component]>
    {
        const menu = new AddNodeMenu(language);
        parent.appendChild(menu);

        return new Promise((resolve, reject) => {
            menu.on("confirm", () => resolve([menu.name, nodeTypes[menu.selectIndex]]));
            menu.on("close", () => reject());
        });
    }

    constructor( language: CVLanguageManager)
    {
        super();

        this.language = language;
        this.position = "center";
        this.modal = true;
        const currentLights = this.language.getGraphComponents(CLight);
        for(let idx = 0; !this.name; idx++){
          let name = `New Light #${idx}`;
          if(!currentLights.find(l=>l.node.name === name)) this.name = name;
        }
    }

    close()
    {
        this.dispatchEvent(new CustomEvent("close"));
        this.remove();
    }

    confirm()
    {
      if(!this.name){
        this.errorString = "Provide a name for the node";
      }else if(this.selectIndex === -1){
        this.errorString = "select a node type";
      }else{
        this.errorString = null
      }
      if(this.errorString){
        this.requestUpdate();
      }else{
        this.dispatchEvent(new CustomEvent("confirm"));
        this.remove();
      }
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-option-menu", "sv-addnode-menu");
    }

    protected renderNodeType(type: typeof Component, index: number)
    {
        return html`<div class="sv-entry ff-flex-row" @click=${(e)=>this.onSelect(e, index)} ?selected=${ index === this.selectIndex }>
          ${("icon" in type)? html`<ff-icon name=${type.icon}></ff-icon>`:null}
            ${(type as any).text || type.name}
        </div>`;
    }
    
    protected onSelect = (e:MouseEvent, index :number)=>{
      this.selectIndex = index;
      this.requestUpdate();
    }

    protected onNameChange = (ev:Event)=>{
      this.name = (ev.target as HTMLInputElement).value;
    }

    protected render()
    {
        const language = this.language;

        return html`
        <div>
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-flex-row">
                    <div class="ff-flex-spacer ff-title">Create new Node</div>
                    <ff-button icon="close" transparent class="ff-close-button" title=${language.getLocalizedString("Close")} @click=${this.close}></ff-button>
                </div>
                <div class="sv-entry">
                  <div class="ff-flex-row">
                      <label class="ff-label ff-off">${language.getLocalizedString("Node name")}:</label>
                      <div class="ff-flex-spacer"></div>
                      <input id="modelName" tabindex="0" class="ff-property-field ff-input" @change=${this.onNameChange} value="${this.name}" touch-action="none" style="touch-action: none;" title="Node.Name [string]"><div class="ff-fullsize ff-off ff-content"></div></input>
                  </div>
              </div>
                <div class="ff-flex-row">
                    <div class="ff-flex-spacer ff-header">${language.getLocalizedString("Select Node Type")}:</div>
                </div>
                <div class="ff-splitter-section" style="flex-basis: 70%">
                    <div class="ff-scroll-y">
                        ${nodeTypes.map((NodeType, index) => this.renderNodeType(NodeType, index))}
                    </div>
                </div>
                <div class="ff-flex-row sv-centered">
                    <ff-button icon="upload" class="ff-button ff-control" text=${language.getLocalizedString("Create Node")} title=${language.getLocalizedString("Create Node")} @click=${this.confirm}></ff-button>
                </div>
                <div class="ff-flex-row sv-centered sv-error-msg">
                    <div>${this.errorString}</div>
                </div>
            </div>
        </div>
        `;
    }

}
