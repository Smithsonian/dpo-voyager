import { IUpdateContext } from "@ff/graph/Component";
import CDirectionalLight from "@ff/scene/components/CDirectionalLight";
import { Property } from "@ff/scene/ui/PropertyField";
import { lightTypes } from "client/applications/coreTypes";
import NVNode from "client/nodes/NVNode";
import MainView from "client/ui/explorer/MainView";
import CreateLightMenu from "client/ui/story/CreateLightMenu";
import LightsTaskView from "client/ui/story/LightsTaskView";
import CVDocumentProvider from "./CVDocumentProvider";
import CVNode from "./CVNode";
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
        type: types.Enum("Light.Type", ELightType, ELightType.directional),
    };
    protected static readonly outs = {
    };

    ins = this.addInputs<CVTask, typeof CVLightsTask.ins>(CVLightsTask.ins);
    outs = this.addOutputs<CVTask, typeof CVLightsTask.outs>(CVLightsTask.outs);

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

    update(context: IUpdateContext) {
        const { ins } = this;

        if (ins.create.changed) {
            const mainView: MainView = document.getElementsByTagName('voyager-story')[0] as MainView;
            const activeDoc = this.getMainComponent(CVDocumentProvider).activeComponent;

            CreateLightMenu.show(mainView, activeDoc.setup.language).then(([selectedType, name]) => {
                this.createLight(selectedType, name);
                return true;
            }).catch(e => console.error("Error creating light:", e));
        }

        const light: CLight | undefined = this.nodeProvider.activeNode?.light;
        if (light) {
            if (ins.name.changed && light.node.name !== ins.name.value) {
                light.node.name = ins.name.value;
                return true;
            }
            if (ins.delete.changed) {
                this.deleteLight(light);
                return true;
            }

            const lightType: string = ELightType[(light.constructor as any).type];
            if (ins.type.changed && ins.type.value !== lightType as unknown) {
                const newLight: NVNode = this.createLight(ins.type.value, light.node.name);
                CVLightsTask.copyAllProperties(light, newLight);
                this.deleteLight(light);
                this.nodeProvider.activeNode = newLight;
                return true;
            }
        }
        return false;
    }

    protected createLight(selectedType: ELightType, name: string): NVNode {
        const lightType = lightTypes.find(lt => lt.type === ELightType[selectedType].toString());

        const lightNode = this.system.findNodeByName("Lights") as NVNode;
        const childNode = lightNode.graph.createCustomNode(lightNode);
        childNode.transform.createComponent<ICVLight>(lightType);
        childNode.name = name;

        lightNode.transform.addChild(childNode.transform);

        return childNode;
    }

    protected deleteLight(light: CLight) {
        light.node.dispose();
    }

    protected static copyAllProperties(source: CLight, target: NVNode) {
        CVLightsTask.copyProperties((source as any).settingProperties, target.light.ins.properties);
        if (source instanceof CDirectionalLight) {
            // CDirectionalLight multiplies intensity by PI, so it needs to be compensated (divide by PI)
            target.light.ins.setValues({ "intensity": source.light.intensity / Math.PI });
        }

        CVLightsTask.copyProperties((source.transform as CVNode).settingProperties, target.transform.ins.properties);
        // TODO: copy shadow properties?
        // TODO: should this be a method NVNode.copyProperties(source)?

    }
    protected static copyProperties(sourceProperties: Property[], targetProperties: Property[]) {
        for (const prop of sourceProperties) {
            const _target: Property | undefined = targetProperties.find(p => p.key === prop.key);
            if (_target) {

                _target.setValue(prop.value);
            }
        }
    }
}