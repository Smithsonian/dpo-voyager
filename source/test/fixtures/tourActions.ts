import System from "@ff/graph/System";
import CVMeta from "client/components/CVMeta";
import CVActionManager from "client/components/CVActionManager";
import CVActionsTask from "client/components/CVActionsTask";
import CVToursTask from "client/components/CVToursTask";
import CVSnapshots from "client/components/CVSnapshots";
import CVLanguageManager from "client/components/CVLanguageManager";
import { IAction } from "client/schema/meta";
import { ITourStep } from "client/schema/setup";

/** Component logic without the renderer, asset loading, or animation pulse. */
export function tourActionsFixture()
{
    const system = new System();
    system.registry.add(CVMeta);
    const owner = system.graph.createNode("Model");
    const meta = owner.createComponent(CVMeta);
    Object.defineProperty(owner, "meta", { get: () => meta });
    const snapshots = new CVSnapshots(owner, "snapshots");
    const language = new CVLanguageManager(owner, "language");
    const step: ITourStep = { id: "step-1", title: "", titles: { EN: "First step" }, altTexts: {} };
    snapshots.setState({ id: step.id, values: [], curve: 0, duration: 1.5, threshold: 0.5 });
    const tour = { title: "Tour", titles: { EN: "Tour" }, steps: [step] };
    const tours = {
        activeTour: tour,
        activeStep: step,
        activeSteps: tour.steps,
        tours: [tour],
        title: "Tour",
        snapshots,
        ins: { enabled: { value: true } },
        outs: { stepIndex: { value: 0 } },
    };
    const clips = [{ id: "audio", name: "Narration" }];
    const setup = { snapshots, language, tours, audio: { getAudioList: () => clips } };
    const actions = new CVActionManager(owner, "actions");
    Object.defineProperties(actions, { setup: { value: setup }, tours: { value: tours } });
    const document = { setup: { ...setup, actions } };
    const task = new CVActionsTask(owner, "actions-task");
    Object.defineProperty(task, "tours", { value: tours });
    Object.assign(task, { activeDocument: document });
    const toursTask = new CVToursTask(owner, "tours-task");
    return { system, owner, meta, snapshots, language, step, tour, tours, actions, task, toursTask, document };
}

export function tourAction(id: string, type: IAction["type"] = "StateChange", extra: Partial<IAction> = {}): IAction
{
    return { id, name: id, type, trigger: "OnTourStep", triggerDetail: "step-1", enabled: true, ...extra };
}
