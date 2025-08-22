import { lightTypes } from "client/applications/coreTypes";
import { ELightType } from "client/components/lights/CVLight";
import CVLightsTask from "../../components/CVLightsTask";
import { TaskView, customElement, html } from "../../components/CVTask";

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
        const ins = this.task.ins;
        const selectedNode = this.nodeProvider.activeNode;

        if (selectedNode?.light) {
            ins.name.setValue(selectedNode.name);
            const lightType = lightTypes.find(lightType => lightType.typeName === selectedNode.light.typeName);
            ins.type.setValue(ELightType[lightType.type]);
        }

        // TODO move light properties from Settings Task here?
        const detailView = selectedNode?.light ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <sv-property-view .property=${ins.name}></sv-property-view>    
            <sv-property-view .property=${ins.type}></sv-property-view>
        </div>` : null;

        return html`<div class="sv-commands">
            <ff-button text="Create" icon="create" @click=${this.onClickCreate}></ff-button>
            <ff-button text="Delete" icon="trash" ?disabled=${!selectedNode?.light} @click=${this.onClickDelete}></ff-button>
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
}
