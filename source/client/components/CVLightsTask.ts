
import NVNode from "client/nodes/NVNode";
import LightsTaskView from "client/ui/story/LightsTaskView";
import CVTask, { types } from "./CVTask";
import { CLight, ELightType } from "./lights/CVLight";

export default class CVLightsTask extends CVTask {
    static readonly typeName: string = "CVLightsTask";

    static readonly text: string = "Lights";
    static readonly icon: string = "bulb";

    protected static readonly ins = {
        create: types.Event("Light.Create"),
        delete: types.Event("Light.Delete"),
        name: types.String("Light.Name", ""),
        activeId: types.String("Light.ActiveId", ""),
        type: types.Enum("Light.Type", ELightType, ELightType.directional),
        // TODO: set color/intensity defaults
    };
    protected static readonly outs = {
    };

    ins = this.addInputs<CVTask, typeof CVLightsTask.ins>(CVLightsTask.ins);
    outs = this.addOutputs<CVTask, typeof CVLightsTask.outs>(CVLightsTask.outs);

    get lightsList() {
        return this.system.getComponents(CLight);
    }

    lightById(id: string): CLight | undefined {
        return this.lightsList.find(light => light.id === id);
    }

    create(): void {
        super.create();
        this.startObserving();
    }

    dispose(): void {
        this.stopObserving();
        super.dispose();
    }

    createView() {
        return new LightsTaskView(this);
    }

    activateTask(): void {
        super.activateTask();
    }

    deactivateTask(): void {
        super.deactivateTask();
    }

    update() {
        const { ins } = this;
        const light = this.lightById(ins.activeId.value);

        if (light) {
            if (ins.create.changed) {
                console.log("create light", ins.type.value);
            } else if (ins.delete.changed) {
                light.node.dispose();
            }
        }
        return true;
    }

    protected onActiveNode(previous: NVNode, next: NVNode) {
        this.ins.activeId.setValue("");
    }
}