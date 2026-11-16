import { expect } from "chai";

import CVSnapshots, { EEasingCurve } from "client/components/CVSnapshots";
import CVTours from "client/components/CVTours";

import { createDocumentData, createStory, IStory } from "../helpers/story";


describe("CVTours", function() {
    let story: IStory;
    let tours: CVTours;
    let machine: CVSnapshots;

    const orbit = () => story.document.setup.navigation.ins.orbit;

    /** Runs the given number of one-frame updates (60fps). */
    function frames(count: number)
    {
        for (let i = 0; i < count; ++i) {
            story.update();
        }
    }

    /** Records a step whose state is the given orbit, with a one second transition. */
    function recordStep(id: string, values: number[])
    {
        const start = orbit().value.slice();
        orbit().setValue(values);
        machine.setState({ id, values: machine.getCurrentValues(), curve: EEasingCurve.Linear, duration: 1, threshold: 0.5 });
        orbit().setValue(start);
    }

    beforeEach(function() {
        story = createStory(createDocumentData([ { name: "Model A" } ]));
        tours = story.document.setup.tours;
        machine = story.document.setup.snapshots;
        frames(2);

        orbit().setValue([ 10, 20, 0 ]);
        recordStep("s1", [ 42.1, -8.4, 0 ]);
        recordStep("s2", [ 3.3, 7.7, 0 ]);
        tours.fromData([{ title: "Tour", steps: [ { id: "s1", title: "1" }, { id: "s2", title: "2" } ] } as any]);
        frames(1);
    });

    describe("setEnabled()", function() {
        it("enables tours and closes the reader", function() {
            const reader = story.document.setup.reader.ins;
            reader.enabled.setValue(true);

            expect(tours.setEnabled(true)).to.be.true;
            expect(tours.ins.enabled.value).to.be.true;
            expect(reader.enabled.value).to.be.false;
        });

        it("shows the tour menu when enabling after a tour was left", function() {
            tours.setEnabled(true);
            frames(1);
            tours.ins.tourIndex.setValue(0);
            frames(70);
            tours.setEnabled(false);
            frames(70);

            tours.setEnabled(true);
            frames(1);
            expect(tours.outs.tourIndex.value).to.equal(-1);
        });

        it("keeps the current step when tours are already enabled", function() {
            tours.setEnabled(true);
            frames(1);
            tours.ins.tourIndex.setValue(0);
            frames(70);
            tours.ins.next.set();
            frames(70);

            expect(tours.setEnabled(true)).to.be.false;
            frames(70);
            expect(orbit().value).to.deep.equal([ 3.3, 7.7, 0 ]);
        });

        it("still restores the view from before the tour after being repeated", function() {
            tours.setEnabled(true);
            frames(1);
            tours.ins.tourIndex.setValue(0);
            frames(70);
            tours.setEnabled(true);
            frames(1);

            tours.setEnabled(false);
            frames(70);
            expect(orbit().value).to.deep.equal([ 10, 20, 0 ]);
        });

        it("leaves the reader open when tours are already enabled", function() {
            tours.setEnabled(true);
            frames(1);
            const reader = story.document.setup.reader.ins;
            reader.enabled.setValue(true);

            expect(tours.setEnabled(true)).to.be.false;
            expect(reader.enabled.value).to.be.true;
        });

        it("keeps the reader closed after leaving tours", function() {
            const reader = story.document.setup.reader.ins;
            reader.enabled.setValue(true);
            frames(1);

            tours.setEnabled(true);
            frames(1);
            tours.setEnabled(false);
            frames(70);
            expect(reader.enabled.value).to.be.false;
        });

        it("reports leaving tours only once when disabled twice", function() {
            tours.setEnabled(true);
            frames(1);

            expect(tours.setEnabled(false)).to.be.true;
            frames(1);
            expect(tours.setEnabled(false)).to.be.false;
        });
    });
});
