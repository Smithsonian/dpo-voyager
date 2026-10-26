import { expect } from "chai";
import Graph from "@ff/graph/Graph";
import CVMeta from "client/components/CVMeta";
import { IAction } from "client/schema/meta";
import { tourAction, tourActionsFixture } from "../fixtures/tourActions";

describe("CVActionManager tour step actions", function() {
    it("returns no actions when no step is selected", function() {
        const f = tourActionsFixture();
        f.meta.actions.items = [tourAction("state")];
        f.tours.activeStep = null;
        expect(f.actions.getTourStepActions()).to.deep.equal([]);
    });

    it("collects every action type across owners, including disabled actions", function() {
        const f = tourActionsFixture();
        const types: IAction["type"][] = ["PlayAnimation", "PlayAudio", "ShowAnnotation", "HideAnnotation",
            "ToggleAnnotation", "StateChange", "EnableAction", "DisableAction"];
        const other = f.system.graph.createNode("Other model").createComponent(CVMeta);
        f.meta.actions.items = types.slice(0, 4).map(type => tourAction(type, type));
        other.actions.items = types.slice(4).map(type => tourAction(type, type, { enabled: false }));
        const entries = f.actions.getTourStepActions();
        expect(entries.map(entry => entry.action.type)).to.deep.equal(types);
        expect(entries.slice(0, 4).every(entry => entry.node === f.owner)).to.equal(true);
        expect(entries.slice(4).every(entry => entry.node === other.node && !entry.action.enabled)).to.equal(true);
    });

    it("matches step IDs only and stays within the document graph", function() {
        const f = tourActionsFixture();
        f.meta.actions.items = [tourAction("attached"), tourAction("click", "StateChange", { trigger: "OnClick" }),
            tourAction("different-step", "StateChange", { triggerDetail: "other" }),
            tourAction("legacy", "StateChange", { triggerDetail: "Tour\x1F1" })];
        const otherGraph = new Graph(f.system, null);
        otherGraph.createNode("Other document").createComponent(CVMeta).actions.items = [tourAction("other-document")];
        expect(f.actions.getTourStepActions().map(entry => entry.action.id)).to.deep.equal(["attached"]);
    });

    it("resolves referenced names and tolerates missing annotation, state, and audio references", function() {
        const f = tourActionsFixture();
        f.snapshots.deltaStates.push({ id: "state", title: "Target state" } as any);
        f.meta.actions.items = [tourAction("audio", "PlayAudio", { audioId: "audio" }),
            tourAction("state", "StateChange", { stateId: "state" }),
            tourAction("target", "DisableAction", { actionTargetId: "state" }),
            tourAction("missing-annotation", "ShowAnnotation", { actionAnnoId: "missing" }),
            tourAction("missing-state", "StateChange", { stateId: "missing" }),
            tourAction("missing-audio", "PlayAudio", { audioId: "missing" })];
        const entries = f.actions.getTourStepActions();
        expect(entries[0].audioName).to.equal("Narration");
        expect(entries[1].stateTitle).to.equal("Target state");
        expect(entries[2].targetActionName).to.equal("state");
        expect(entries[3].annotationTitles).to.deep.equal([undefined]);
        expect(entries[4].stateTitle).to.equal(undefined);
        expect(entries[5].audioName).to.equal(undefined);
    });
});
