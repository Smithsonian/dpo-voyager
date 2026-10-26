import { expect } from "chai";
import { tourActionsFixture } from "../fixtures/tourActions";

describe("CVActionsTask navigation", function() {
    it("selects the owner and activates the editor before setting the action ID", function() {
        const f = tourActionsFixture();
        const order: string[] = [];
        const nodes = { set activeNode(value) { expect(value).to.equal(f.owner); order.push("owner"); } };
        const tasks = { set activeComponent(value) {
            expect(value).to.equal(f.task); order.push("task");
            f.task.ins.activeId.setValue("");
        } };
        Object.defineProperty(f.task, "nodeProvider", { value: nodes });
        Object.assign(f.task, { getMainComponent: () => tasks });
        f.task.ins.activeId.on("value", () => {
            const value = f.task.ins.activeId.value;
            if (value) order.push(value);
        });
        f.task.editAction(f.owner as any, "action-id");
        expect(order).to.deep.equal(["owner", "task", "action-id"]);
        expect(f.task.ins.activeId.value).to.equal("action-id");
    });
});
