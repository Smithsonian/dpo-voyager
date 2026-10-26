import { expect } from "chai";
import { render } from "lit-html";
import Table from "@ff/ui/Table";
import TourPanel from "client/ui/story/TourPanel";
import { tourAction, tourActionsFixture } from "../fixtures/tourActions";

function renderPanel(f: ReturnType<typeof tourActionsFixture>)
{
    const panel = new TourPanel(f.system);
    const table = new Table();
    Object.defineProperty(panel, "toursTask", { value: f.toursTask });
    Object.assign(panel, { tours: f.tours, activeDocument: f.document, stateTable: table });
    const container = document.createElement("div");
    // Detached DOM exercises rendering without mounting the full application or measuring layout.
    render((panel as any).render(), container);
    return { panel, table, container };
}

describe("TourPanel attached actions", function() {
    it("renders relevant action details while preserving the existing step controls and timing", function() {
        const f = tourActionsFixture();
        f.meta.actions.items = [tourAction("Open model", "PlayAnimation", {
            animation: "Open lid", speed: 2, audioId: "irrelevant-audio", stateId: "irrelevant-state",
        })];
        const { table, container } = renderPanel(f);
        expect(table.rows).to.have.length(1);
        expect(table.rows[0]).to.include({ title: "First step", curve: "Linear", duration: "1.5s", threshold: "50%" });
        const properties = Array.from(container.querySelectorAll("sv-property-view")).map((view: any) => view.property);
        expect(properties).to.include(f.toursTask.ins.stepTitle);
        expect(properties).to.include(f.toursTask.ins.stepCurve);
        expect(properties).to.include(f.toursTask.ins.stepDuration);
        expect(properties).to.include(f.toursTask.ins.stepThreshold);
        const action = container.querySelector(".sv-tour-action");
        expect(container.textContent).to.contain("Attached actions (1)");
        expect(action.textContent).to.contain("Open model").and.to.contain("Play Animation").and.to.contain("Model");
        expect(action.textContent).to.contain("Animation: Open lid").and.to.contain("Speed: 2×");
        expect(action.textContent).not.to.contain("Audio:").and.not.to.contain("State:");
    });

    it("lists only the selected step's actions and preserves tour row order", function() {
        const f = tourActionsFixture();
        f.tour.steps.push({ id: "step-2", title: "", titles: { EN: "Second step" } });
        f.snapshots.setState({ id: "step-2", values: [], curve: 0, duration: 2, threshold: 0.25 });
        f.meta.actions.items = [tourAction("First action"), tourAction("Second action", "PlayAudio", { triggerDetail: "step-2" })];
        f.tours.activeStep = f.tour.steps[1];
        f.tours.outs.stepIndex.value = 1;
        const { table, container } = renderPanel(f);
        expect(table.rows.map((row: any) => row.title)).to.deep.equal(["First step", "Second step"]);
        expect(table.rows[1]).to.include({ curve: "Linear", duration: "2.0s", threshold: "25%" });
        expect(container.querySelectorAll(".sv-tour-action")).to.have.length(1);
        expect(container.querySelector(".sv-tour-actions").textContent).to.contain("Second action").and.not.to.contain("First action");
    });

    it("omits the entire attached-actions section when the selected step has no actions", function() {
        const { container } = renderPanel(tourActionsFixture());
        expect(container.querySelectorAll(".sv-tour-action")).to.have.length(0);
        expect(container.querySelector(".sv-tour-actions")).to.equal(null);
        expect(container.textContent).not.to.contain("Attached actions");
        expect(container.textContent).not.to.contain("No actions attached");
    });

    it("opens the clicked action through the Action task API", function() {
        const f = tourActionsFixture();
        const action = tourAction("Model action");
        f.meta.actions.items = [action];
        const { panel, container } = renderPanel(f);
        const selected: any[] = [];
        Object.assign(panel, { system: { getMainComponent: () => ({ editAction: (...args) => selected.push(args) }) } });
        (container.querySelector(".sv-tour-action") as HTMLButtonElement).click();
        expect(selected).to.deep.equal([[f.owner, action.id]]);
    });
});
