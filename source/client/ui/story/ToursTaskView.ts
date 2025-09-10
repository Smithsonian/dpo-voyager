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


import List from "@ff/ui/List";
import sanitizeHtml from 'sanitize-html';

import { ITour } from "client/schema/setup";

import CVToursTask from "../../components/CVToursTask";
import { TaskView, customElement, property, html } from "../../components/CVTask";
import { ILineEditChangeEvent } from "@ff/ui/LineEdit";

import CVDocument from "../../components/CVDocument";
import Button, { IButtonClickEvent } from "@ff/ui/Button";
import { ELanguageType } from "client/schema/common";
import CVSnapshots, { IPropertyTreeNode } from "client/components/CVSnapshots";

import "@ff/ui/Tree";
import Tree, { PropertyValues, TemplateResult } from "@ff/ui/Tree";
////////////////////////////////////////////////////////////////////////////////


@customElement("sv-tours-task-view")
export default class ToursTaskView extends TaskView<CVToursTask>
{
    protected featureConfigMode = false;

    protected get snapshots() {
        return this.activeDocument.setup.snapshots;
    }

    protected renderFeatureMenu()
    {

        const languageManager = this.activeDocument.setup.language;

        return html`<div class="ff-scroll-y">
            <div class="sv-commands">
                <ff-button text="${languageManager.getUILocalizedString("Go Back")}" icon="triangle-left" @click=${this.onFeatureMenuConfirm}></ff-button>
            </div>
            <p>
                TODO: put a nice explanation here?
            </p>
            <div class="sv-tour-feature-menu">
                <sv-tour-property-tree .snapshots=${this.snapshots}></sv-tour-property-tree>
            </div>
        </div>`;
    }

    protected render()
    {
        //console.log("TourTaskView.render");

        if(!this.activeDocument) {
            return;
        }

        const task = this.task;
        const tours = task.tours;

        if (!tours) {
            return html`<div class="sv-placeholder">Please select a document to edit its tours.</div>`;
        }
        if (!tours.ins.enabled.value) {
            return html`<div class="sv-placeholder">Please activate the tour button in the main menu.</div>`;
        }

        if (this.featureConfigMode) {
            return this.renderFeatureMenu();
        }

        const tourList = tours.tours;
        const activeTour = tours.activeTour;
        const props = task.ins;
        const languageManager = this.activeDocument.setup.language;
        const activeLanguage = ELanguageType[languageManager.ins.activeLanguage.value];
        const primarySceneLanguage = ELanguageType[languageManager.ins.primarySceneLanguage.value];

        const detailView = activeTour ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <sv-property-view .property=${languageManager.ins.activeLanguage}></sv-property-view>
            <div class="sv-label">${languageManager.getUILocalizedString("Title")}</div>
            <ff-line-edit name="title" text=${props.tourTitle.value} @change=${this.onTextEdit}></ff-line-edit>
            <div class="sv-label">${languageManager.getUILocalizedString("Tags")}</div>
            <ff-line-edit name="tags" text=${props.tourTags.value} @change=${this.onTextEdit}></ff-line-edit>
            <div class="sv-label">${languageManager.getUILocalizedString("Lead")}</div>
            <ff-text-edit name="lead" text=${props.tourLead.value} @change=${this.onTextEdit}></ff-text-edit>
        </div>` : null;

        return html`
        <div class="sv-commands">
            <ff-button title="${languageManager.getUILocalizedString("Snapshot Configuration")}" text="${languageManager.getUILocalizedString("Snapshot Configuration")}" icon="key" @click=${this.onClickConfig}></ff-button>
        </div>
        <div class="sv-commands">
            <ff-button title="${languageManager.getUILocalizedString("Create Tour")}" icon="create" @click=${this.onClickCreate}></ff-button>
            <ff-button title="${languageManager.getUILocalizedString("Move Tour Up")}" icon="up" ?disabled=${!activeTour} @click=${this.onClickUp}></ff-button>
            <ff-button title="${languageManager.getUILocalizedString("Move Tour Down")}" icon="down" ?disabled=${!activeTour} @click=${this.onClickDown}></ff-button>
            <ff-button title="${languageManager.getUILocalizedString("Delete Tour")}" icon="trash" ?disabled=${!activeTour} @click=${this.onClickDelete}></ff-button>

        </div>
        <div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-flex-row ff-group"><div class="sv-panel-header sv-task-item">${languageManager.getUILocalizedString("Default:") + " " + primarySceneLanguage}</div><div class="sv-panel-header sv-task-item sv-item-border-l">${languageManager.getUILocalizedString("Active:") + " " + activeLanguage}</div></div>
                <div class="ff-splitter-section" style="flex-basis: 30%">
                    <div class="ff-scroll-y ff-flex-column">
                        <sv-tour-list .data=${tourList.slice()} .selectedItem=${activeTour} .activeLanguage=${activeLanguage} .primarySceneLanguage=${primarySceneLanguage} @select=${this.onSelectTour}></sv-tour-list>
                    </div>
                </div>
                <ff-splitter direction="vertical"></ff-splitter>
                <div class="ff-splitter-section" style="flex-basis: 70%">
                    ${detailView}
                </div>
            </div>
        </div>`;
    }

    protected onClickCreate()
    {
        this.task.ins.createTour.set();
    }

    protected onClickDelete()
    {
        this.task.ins.deleteTour.set();
    }

    protected onClickUp()
    {
        this.task.ins.moveTourUp.set();
    }

    protected onClickDown()
    {
        this.task.ins.moveTourDown.set();
    }

    protected onClickConfig()
    {
        this.featureConfigMode = true;
        this.requestUpdate();
    }

    protected onSelectTour(event: ISelectTourEvent)
    {
        this.task.tours.ins.tourIndex.setValue(event.detail.index);
    }


    protected onFeatureMenuConfirm()
    {
        //this.snapshots.updateTargets();

        this.featureConfigMode = false;
        this.requestUpdate();
    }

    protected onFeatureMenuCancel()
    {
        this.featureConfigMode = false;
        this.requestUpdate();
    }

    protected onTextEdit(event: ILineEditChangeEvent)
    {
        const task = this.task;
        const target = event.target;
        const text = event.detail.text;

        if (target.name === "title") {
            task.ins.tourTitle.setValue(sanitizeHtml(text,
                {
                    allowedTags: [ 'i' ],
                }
            ));
        }
        else if (target.name === "lead") {
            task.ins.tourLead.setValue(sanitizeHtml(text, 
                {
                    allowedTags: [ 'b', 'i', 'em', 'strong', 'sup', 'sub' ],
                }
            ));
        }
        else if (target.name === "tags") {
            task.ins.tourTags.setValue(text);
        }
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            previous.setup.tours.outs.tourIndex.off("value", this.onUpdate, this);
        }
        if (next) {
            next.setup.tours.outs.tourIndex.on("value", this.onUpdate, this);
        }

        this.requestUpdate();
    }
}

////////////////////////////////////////////////////////////////////////////////

interface ISelectTourEvent extends CustomEvent
{
    target: TourList;
    detail: {
        tour: ITour;
        index: number;
    }
}

@customElement("sv-tour-list")
export class TourList extends List<ITour>
{
    @property({ attribute: false })
    selectedItem: ITour = null;

    @property({ attribute: false })
    activeLanguage: ELanguageType = null;

    @property({ attribute: false })
    primarySceneLanguage: ELanguageType = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-tour-list");
    }

    protected renderItem(item: ITour)
    {
        // TODO: Temporary - remove when single string properties are phased out
        if(Object.keys(item.titles).length === 0) { 
            item.titles[this.primarySceneLanguage] = item.title;
        }
        const primaryTitle = item.titles[this.primarySceneLanguage];
        const activeTitle = item.titles[this.activeLanguage];
        const missingTitle = html `<span class="sv-missing-translation">Missing content</span>`
        
        return html`<div class="ff-flex-row ff-group">
        <div class="sv-task-item">${primaryTitle? primaryTitle : missingTitle}</div>
        <div class="sv-task-item sv-item-border-l">${activeTitle ? activeTitle : missingTitle}</div>
        </div>`;
    }

    protected isItemSelected(item: ITour)
    {
        return item === this.selectedItem;
    }

    protected onClickItem(event: MouseEvent, item: ITour, index: number)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { tour: item, index }
        }));
    }

    protected onClickEmpty(event: MouseEvent)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { tour: null, index: -1 }
        }));
    }
}

@customElement("sv-tour-property-tree")
export class TourPropertyTree extends Tree<IPropertyTreeNode>{
    @property({attribute: false, type: Object})
    snapshots: CVSnapshots;

    private expanded = new Set<string>();

    protected update(changedProperties: PropertyValues): void {
        this.root = this.snapshots?.getSnapshotPropertyTree();
        if(this.expanded.size === 0){
            this.root.children.forEach(c=>{
                if(!this.isRecursiveDeselected(c)){
                    this.expanded.add(c.id);
                }
            });
        }
        super.update(changedProperties);
    }
    protected renderNodeHeader(node: IPropertyTreeNode): TemplateResult
    {
        const withButton = 0 < node.children?.length;
        let buttonText = "mixed";
        let className ="partial-selected";
        if(withButton &&this.isRecursiveDeselected(node)){
            buttonText = "all untracked";
            className = "";
        }else if(withButton && this.isRecursiveSelected(node)){
            buttonText = "all tracked";
            className = "selected";
        }
        return html`
            <span class="ff-flex-item-stretch">${node.text}</span>
            ${withButton?
                html`<ff-button role="switch" class="ff-button ff-control ${className}" text=${buttonText} name="${node.id}" @click=${this.onToggleGroupSelection}></ff-button>`
                :html`<ff-icon class="ff-off" name="${node.selected?"lock":"unlock"}"></ff-icon>`}
        `;
    }

    /**
     * Returns true if a node is explicitly selected or "selected" is undefined and all of its children are.
     */
    protected isRecursiveSelected = (n:IPropertyTreeNode):boolean =>{
        if("selected" in n) return n.selected;
        else if(Array.isArray(n.children)) return n.children?.every(this.isRecursiveSelected);
        else return false;
    }

    protected isRecursiveDeselected = (n: IPropertyTreeNode):boolean =>{
        if("selected" in n) return !n.selected;
        else if(Array.isArray(n.children)) return n.children?.every(this.isRecursiveDeselected);
        else return true;
    }

    protected recursiveSetSelected = (treeNode: IPropertyTreeNode, state?:boolean): boolean=>{
        if(typeof state === "undefined") state = !this.isRecursiveSelected(treeNode);
        if("property" in treeNode){
            if(state){
                this.snapshots.addTargetProperty(treeNode.property, true);
            }else{
                this.snapshots.removeTargetProperty(treeNode.property, true);
            }
        }
        treeNode.children?.forEach((c)=>this.recursiveSetSelected(c, state));
        return state;
    }

    protected onToggleGroupSelection(ev: MouseEvent){
        const treeNode = this.getNodeFromEventTarget(ev);

        this.recursiveSetSelected(treeNode);
        this.requestUpdate("root");
        ev.stopPropagation();
    }

    protected onNodeClick(ev: MouseEvent, node: IPropertyTreeNode){
        if(node.children?.length){
            return super.onNodeClick(ev, node);
        }
        console.log("Toggle select :", node.id);
        const prop = node.property;
        if(this.snapshots.hasTargetProperty(prop)){
            this.snapshots.removeTargetProperty(prop);
        }else{
            this.snapshots.addTargetProperty(prop);
        }
        this.requestUpdate("root");
        ev.stopPropagation();
    }

    public setExpanded(treeNode: IPropertyTreeNode, state?:boolean): void {
        console.log("set expanded");
        if(typeof state === "undefined"){
            this.expanded.delete(treeNode.id) || this.expanded.add(treeNode.id);
        }else if (state){
            this.expanded.add(treeNode.id);
        }else{
            this.expanded.delete(treeNode.id);
        }
        super.setExpanded(treeNode, state);
    }

    //Recursively check if the node or some of its children is selected
    public isNodeExpanded(n:IPropertyTreeNode): boolean{
        return this.expanded.has(n.id);
    }

    public isNodeSelected(treeNode: IPropertyTreeNode): boolean {
        //No recursive check here because we don't want to highlight the whole node when all its children are selected
        return !!treeNode.selected;
    }

}