import { lightTypes } from "client/applications/coreTypes";
import NVNode from "client/nodes/NVNode";
import MainView from "client/ui/explorer/MainView";
import CreateLightMenu from "client/ui/story/CreateLightMenu";
import LightsTaskView from "client/ui/story/LightsTaskView";
import CVDocumentProvider from "./CVDocumentProvider";
import CVTask, { types } from "./CVTask";
import { CLight, ELightType, ICVLight } from "./lights/CVLight";

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

        if (ins.create.changed) {
            const mainView: MainView = document.getElementsByTagName('voyager-story')[0] as MainView;
            const activeDoc = this.getMainComponent(CVDocumentProvider).activeComponent;

            CreateLightMenu.show(mainView, activeDoc.setup.language).then(([selectedType, name]) => {
                const lightType = lightTypes.find(lt => lt.type === ELightType[selectedType].toString());

                const lightNode = this.system.findNodeByName("Lights") as NVNode;
                const childNode = lightNode.graph.createCustomNode(lightNode);
                childNode.transform.createComponent<ICVLight>(lightType);
                childNode.name = name;

                lightNode.transform.addChild(childNode.transform);
            }).catch(e => console.error("Error creating light:", e));
        }

        const light = this.lightById(ins.activeId.value);
        if (light) {
            if (ins.name.changed) {
                light.node.name = ins.name.value;
            } if (ins.delete.changed) {
                light.node.dispose();
            }
        }
        return true;
    }

    protected onActiveNode(previous: NVNode, next: NVNode) {
        this.ins.activeId.setValue("");
    }
}