import List from "client/../../libs/ff-ui/source/List";
import CVAnnotationView from "client/components/CVAnnotationView";
import CVLightsTask from "../../components/CVLightsTask";
import { ILight, TLightType } from "client/schema/document";
import { TaskView, customElement, html, property } from "../../components/CVTask";
import CLight from "@ff/scene/components/CLight";
import { ELightType } from "client/components/lights/CVLight";
import { lightTypes } from "client/applications/coreTypes";

@customElement("sv-light-task-view")
export default class LightsTaskView extends TaskView<CVLightsTask> {
    protected connected(): void {
        super.connected();
        this.task.on("update", this.onUpdate, this);
    }

    protected disconnected(): void {
        this.task.off("update", this.onUpdate, this);
        super.disconnected();
    }

    protected render() {
        // if (!this.task.lightManager) {
        //     return html`<div class="sv-placeholder">No lights available in this scene.</div>`;
        // }

        const ins = this.task.ins;
        const lightsList = this.task.lightsList;


        const selectedNode = this.nodeProvider.activeNode;
        let lightElement = this.task.lightById(ins.activeId.value);

        if (selectedNode && selectedNode.light) {
            lightElement = lightsList.find((light) => light.node.name === selectedNode.name);
            if (lightElement) {
                ins.name.setValue(selectedNode.name);
                const lightType = lightTypes.find(lightType => lightType.typeName === lightElement.typeName);
                ins.type.setValue(ELightType[lightType.type]);
                ins.activeId.setValue(lightElement.id);
            } else {
                throw new Error("Light not found for selected node");
            }
        }


        // <sv-property-view .property=${selectedNode.name}></sv-property-view>    

        // <ff-splitter direction="vertical"></ff-splitter>
        // <div class="ff-flex-row ff-group"><div class="sv-panel-header sv-task-item">Type</div><div class="sv-panel-header sv-task-item sv-item-border-l">Trigger</div></div>

        // TODO add color/intensity properties
        const detailView = lightElement ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <sv-property-view .property=${ins.activeId}></sv-property-view>    
            <sv-property-view .property=${ins.name}></sv-property-view>    
            <sv-property-view .property=${ins.type}></sv-property-view>
        </div>` : null;

        return html`<div class="sv-commands">
            <ff-button text="Create" icon="create" @click=${this.onClickCreate}></ff-button>
            <ff-button text="Delete" icon="trash" ?disabled=${!lightElement} @click=${this.onClickDelete}></ff-button>
        </div>
        <div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-splitter-section" style="flex-basis: 70%">
                    ${detailView}
                </div>
            </div>
        </div>`;
    }

    protected onClickCreate() {
        this.task.ins.create.set();
    }

    protected onClickDelete() {
        this.task.ins.delete.set();
    }
    protected onSelectAction(event: ISelectLightEvent) {
        this.task.ins.activeId.setValue(event.detail.light ? event.detail.light.id : "");
        this.onUpdate();
    }
}

interface ISelectLightEvent extends CustomEvent {
    target: LightList;
    detail: {
        light: ILight;
        index: number;
    }
}

@customElement("sv-light-list")
export class LightList extends List<ILight> {
    @property({ attribute: false })
    selectedItem: ILight = null;

    protected firstConnected(): void {
        super.firstConnected();
        this.classList.add("sv-group", "sv-light-list");
    }
    protected renderItem(item: ILight) {
        return html`<div class="ff-flex-row ff-group">
            <div class="sv-task-item">${item.id}</div>
            <div class="sv-task-item">${item.type}</div>
        </div>`;
    }
    protected isItemSelected(item: ILight): boolean {
        return this.selectedItem === item;
    }
    protected onItemClick(event: MouseEvent, item: ILight, index: number): void {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { action: item, index }
        }));
    }
    protected onClickEmpty(event: MouseEvent): void {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { action: null, index: -1 }
        }));
    }
}