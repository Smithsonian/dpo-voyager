/**
* Funded by the Netherlands eScience Center in the context of the
* [Dynamic 3D]{@link https://research-software-directory.org/projects/dynamic3d} project.
*
* @author Carsten Schnober <c.schnober@esciencecenter.nl>
*/

import { assert } from "chai";
import System from "@ff/graph/System";
import CTweenMachine from "@ff/graph/components/CTweenMachine";
import { IPulseContext } from "@ff/graph/components/CPulse";
import { createDayjsUtc } from "@ff/graph/propertyTypes";
import TestComponent from "./TestComponent";

////////////////////////////////////////////////////////////////////////////////

const context: IPulseContext = {
    time: new Date(),
    secondsElapsed: 0,
    secondsDelta: 0,
    frameNumber: 0,
    tickUpdated: false,
    tockUpdated: false,
};

export default function() {
    suite("TweenMachine", function() {
        const system = new System();
        system.registry.add(TestComponent);
        system.registry.add(CTweenMachine);

        const node = system.graph.createNode("Test");
        const comp = node.createComponent(TestComponent, "one");
        const machine = node.createComponent(CTweenMachine, "machine");

        test("datetime/snapshot round-trip", function() {
            machine.addTargetProperty(comp.ins.datetime);
            comp.ins.datetime.setValue(createDayjsUtc("2026-11-09T14:30:00"));

            machine.ins.id.setValue("state1");
            machine.ins.store.set();
            machine.update(context);

            const state = machine.getState("state1");
            assert.isOk(state);
            // the stored value is a naive wall-clock string, not an ISO instant:
            assert.strictEqual(state.values[0], "2026-11-09T14:30:00");

            // simulate saving and reloading the machine state through JSON:
            const jsonState = JSON.parse(JSON.stringify(state));
            machine.stateFromJSON({ states: [ jsonState ] });

            // change the property, then recall the snapshot:
            comp.ins.datetime.setValue(createDayjsUtc("2026-11-10T08:00:00"));
            machine.ins.recall.set();
            machine.update(context);

            const value = comp.ins.datetime.value;
            assert.isTrue(value.isUTC());
            // the displayed wall-clock time is preserved, independent of local timezone:
            assert.strictEqual(value.format("YYYY-MM-DDTHH:mm:ss"), "2026-11-09T14:30:00");
        });

        test("datetime/legacy ISO instant", function() {
            // old snapshots stored dayjs.toJSON() (ISO instant); UTC-mode recall keeps the wall-clock time:
            machine.stateFromJSON({ states: [ { id: "state2", values: [ "2026-11-09T14:30:00Z" ], curve: 0, duration: 2, threshold: 0.5 } ] });

            machine.ins.id.setValue("state2");
            machine.ins.recall.set();
            machine.update(context);

            const value = comp.ins.datetime.value;
            assert.isTrue(value.isUTC());
            assert.strictEqual(value.format("YYYY-MM-DDTHH:mm:ss"), "2026-11-09T14:30:00");
        });
    });
};
