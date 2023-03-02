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

import DocumentView, { property, customElement, html } from "client/ui/explorer/DocumentView";
import {  System } from "@ff/scene/ui/SystemView";
import "@ff/ui/Button";


export interface IDocumentParams
{
    id:string;
    root:string;
    document:string;
    title:string;
    caption:string;
    thumbnail:string;
}

 @customElement("split-object-menu")
 export default class SplitModeObjectMenu extends DocumentView
 {
    private loop :number;

    @property({attribute:false, type: Array })
    docs :IDocumentParams[];

    constructor(system :System)
    {
        super(system);
        this.docs = JSON.parse(localStorage.getItem("playlist-documents") || "[]") as IDocumentParams[] ;
    }
    
    connectedCallback() {
        super.connectedCallback()
    }

     protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("split-object-menu");
        let idx = Math.floor(Math.random()*this.docs.length);
        this.dispatchEvent(new CustomEvent("select", {
            detail: `/?root=${this.docs[idx].root}`
        }));
        let index = 0;
        this.loop = setInterval(()=>{
            index = ++index % this.docs.length;
            this.dispatchEvent(new CustomEvent("select", {
                detail: {document: this.docs[index].root, auto: true}
            }));
        }, 360/0.01) as any;
    }
     
    disconnected(): void {
        console.log("Disconnect menu")
        clearInterval(this.loop);
    }
 
    protected renderEntry(object: IDocumentParams, index: number)
    {
        return html`<a class="object-menu-card" @click=${()=>this.onClickObject(object, index)}>
            <img src=${object.thumbnail} />
            <div class="object-menu-header">
                <h1>${object.title}</h1>
                <p>${object.caption}</p>
            </div>
        </a>`;
    }

    protected render()
    {
        if(!this.docs)
        {
            return html`Chargement...`;
        }
        return html`<div class="split-mode-object-menu ff-scroll-y">
            ${this.docs.map((obj, index) => this.renderEntry(obj, index))}
        </div>`;
    }

    protected onClickObject = (document: IDocumentParams, index: number)=>{
        clearInterval(this.loop);
        this.dispatchEvent(new CustomEvent("select", {
            detail: {document: document.root, route: "scene", auto: true}
        }));
    }
 }