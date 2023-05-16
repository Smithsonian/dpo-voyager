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
import Component from "@ff/graph/Component";

import "./DocumentList";
import "./NodeTree";

import CVTaskProvider from "../../components/CVTaskProvider";
import AddNodeMenu from "./AddNodeMenu";
import MainView from "./MainView";

import CVDocumentProvider from "client/components/CVDocumentProvider";
import NVNode from "client/nodes/NVNode";
import { CLight } from "client/components/CVLight";
import CVNodeProvider from "client/components/CVNodeProvider";
import CVNode from "client/components/CVNode";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-navigator-panel")
export default class NavigatorPanel extends SystemView
{
    protected get taskProvider() {
        return this.system.getMainComponent(CVTaskProvider);
    }

    protected get nodeProvider(){
        return this.system.getMainComponent(CVNodeProvider);
    }

    protected firstConnected()
    {
        this.classList.add("sv-panel", "sv-navigator-panel");
    }

    protected connected()
    {
        this.taskProvider.ins.mode.on("value", this.onChange);
        this.nodeProvider.on("active-node", this.onChange);
        window.addEventListener("keypress",this.onKeypress);
    }

    protected disconnected()
    {
        this.taskProvider.ins.mode.off("value", this.onChange);
        this.nodeProvider.off("active-node",this.onChange);
    }

    onChange = ()=>this.requestUpdate();

    protected render()
    {
        const system = this.system;
        const expertMode = this.taskProvider.expertMode;
        
        // only allow lights for now, enable other nodes as support grows
        const activeNode = this.system.getMainComponent(CVNodeProvider).activeNode;
        const canDelete = !!(activeNode instanceof NVNode && activeNode.light);

        const documentList = expertMode ? html`<div class="ff-splitter-section ff-flex-column" style="flex-basis: 30%">
            <div class="sv-panel-header">
                <ff-icon name="document"></ff-icon>
                <div class="ff-text">Documents</div>
            </div>
            <div class="ff-flex-item-stretch"><div class="ff-scroll-y">
                <sv-document-list .system=${system}></sv-document-list>
            </div></div>
            </div>
            <ff-splitter direction="vertical"></ff-splitter>` : null;

        return html`${documentList}
            <div class="ff-splitter-section ff-flex-column" style="flex-basis: 70%">
                <div class="sv-panel-header">
                    <ff-icon name="hierarchy"></ff-icon>
                    <div class="ff-text" style="flex-grow:1">Nodes</div>
                    <ff-button icon="trash" .disabled=${!canDelete} title="Remove Node" @click=${this.onClickDelete}></ff-button>
                    <ff-button icon="create" title="Add Node" @click=${this.onClickAdd}></ff-button>

                </div>
                <sv-node-tree class="ff-flex-item-stretch" .system=${system}></sv-node-tree>
            </div>`;
    }

    onKeypress = (ev:KeyboardEvent)=>{
        if(!this.nodeProvider.activeNode) return;
        switch(ev.key){
            case "Delete":
                this.onClickDelete();
                ev.stopPropagation();
                break;
        }
    }

    onClickDelete = ()=>{
        
        const node = this.nodeProvider.activeNode;
        this.nodeProvider.activeNode = null;
        node.dispose();
    }

    onClickAdd = ()=>{
        const mainView : MainView = document.getElementsByTagName('voyager-story')[0] as MainView;
        const activeDoc = this.system.getMainComponent(CVDocumentProvider).activeComponent;

        AddNodeMenu.show(mainView, activeDoc.setup.language).then(([name, CType])=>{

            let node = activeDoc.innerGraph.createCustomNode(NVNode);
            let component = node.createComponent(CType);
            let parent = (component instanceof CLight)? activeDoc.system.findNodeByName("Lights") as NVNode: activeDoc.root;
            node.name = name;
            parent.transform.addChild(node.transform);
            
        }, (e)=>{
            if(e) console.error(e);
        })
    }
}