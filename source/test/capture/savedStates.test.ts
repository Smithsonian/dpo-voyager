import { expect } from "chai";

import { IDeltaState } from "@ff/graph/components/CTweenMachine";

import CVAnnotationView from "client/components/CVAnnotationView";
import CVAnnotationsTask from "client/components/CVAnnotationsTask";
import CVModel2 from "client/components/CVModel2";
import CVNodeProvider from "client/components/CVNodeProvider";
import CVSnapshots, { EEasingCurve } from "client/components/CVSnapshots";
import CVTours from "client/components/CVTours";
import Annotation from "client/models/Annotation";

import { activateTask, createDocumentData, createStory, IStory } from "../helpers/story";

/**
 * The snapshot states a document saves: only those its tour steps, annotation views and state changes use.
 */
describe("Saved states", function() {
    let story: IStory;
    let machine: CVSnapshots;

    const savedStates = () => story.document.deflateDocument().setups[0].snapshots?.states || [];

    /** Runs graph updates (a frame each) until no state is tweening: tweens triggered by events start on the next update */
    function settle()
    {
        story.update();
        for (let i = 0; i < 1000; ++i) {
            story.update();
            if (!machine.outs.tweening.value) {
                story.update();
                return;
            }
        }
        throw new Error("still tweening");
    }

    describe("of annotation views", function() {
        let view: CVAnnotationView;
        let task: CVAnnotationsTask;
        let a1: Annotation;

        const orbit = () => story.document.setup.navigation.ins.orbit;
        const viewState = () => JSON.parse(JSON.stringify(savedStates().find(state => state.id === a1.data.viewId)));

        beforeEach(function() {
            const data = createDocumentData([
                { name: "Model A", annotations: [
                    { id: "a1", position: [0, 0, 0], direction: [0, 1, 0], scale: 5 },
                    { id: "a2", position: [1, 0, 0], direction: [0, 1, 0], scale: 5 },
                ]},
            ]);
            // saved bounds, which the document saves again: models without geometry have none
            data.models.forEach(model => model.boundingBox = { min: [-10, -10, -10], max: [10, 10, 10] });
            story = createStory(data);
            const setup = story.document.setup;
            machine = setup.snapshots;
            const model = story.document.innerComponents.getArray(CVModel2)[0];
            view = model.getComponent(CVAnnotationView);
            a1 = view.getAnnotationById("a1");
            settle();

            // the model is selected, as the task needs to edit its annotations
            story.system.getMainComponent(CVNodeProvider).activeNode = model.node;
            task = activateTask(story, CVAnnotationsTask);
            expect(task.activeAnnotations).to.equal(view);
            // views only play with annotations shown
            setup.viewer.ins.annotationsVisible.setValue(true);
            story.update();

            // a1 looks from the side, saved as the task's Save button does
            view.activeAnnotation = a1;
            orbit().setValue([0, 90, 0]);
            story.update();
            task.saveAnnotationView();
            view.activeAnnotation = null;
            orbit().setValue([0, 0, 0]);
            settle();
        });

        it("leave no unused state when saved again", function() {
            const count = savedStates().length;

            view.activeAnnotation = a1;
            settle();
            orbit().setValue([0, 45, 0]);
            story.update();
            task.saveAnnotationView();

            expect(savedStates().length).to.equal(count);
            expect(viewState().values.find(value => Array.isArray(value) && value.length === 3 && value[1] === 45)).to.exist;
        });

        it("aren't saved once their annotation is deleted, in a document that saved them", function() {
            const viewId = a1.data.viewId;
            story = createStory(story.document.deflateDocument());
            machine = story.document.setup.snapshots;
            const loaded = story.document.innerComponents.getArray(CVModel2)[0].getComponent(CVAnnotationView);
            story.update();
            expect(loaded.getAnnotationById("a1").data.viewId).to.equal(viewId);

            loaded.removeAnnotation(loaded.getAnnotationById("a1"));
            expect(savedStates().map(state => state.id)).to.not.include(viewId);
        });
    });

    describe("of tours", function() {
        let tours: CVTours;

        beforeEach(function() {
            story = createStory(createDocumentData([
                { name: "Model A" },
                { name: "Model B", translation: [40, 0, 0] },
            ]));
            machine = story.document.setup.snapshots;
            tours = story.document.setup.tours;
            const modelB = story.document.innerComponents.getArray(CVModel2).find(model => model.node.name === "Model B");
            settle();

            // a tour of models, as the tours task records it: its step hides model B
            machine.targetFeatures["models"] = true;
            machine.updateTargets();
            modelB.ins.visible.setValue(false);
            story.update();
            machine.setState({ id: "s1", values: machine.getCurrentValues(), curve: EEasingCurve.Linear, duration: 1, threshold: 0.5 });
            modelB.ins.visible.setValue(true);
            story.update();
            tours.fromData([{ title: "Tour", steps: [{ id: "s1", title: "1" }] } as any]);
        });

        it("leave out the scene kept to restore when leaving the tour", function() {
            // as the tour menu does: tours are shown, then one is picked
            tours.ins.enabled.setValue(true);
            story.update();
            tours.ins.tourIndex.setValue(0);
            settle();

            expect(savedStates().map(state => state.id)).to.deep.equal([ "s1" ]);
        });
    });

    describe("of state changes", function() {
        beforeEach(function() {
            story = createStory(createDocumentData([ { name: "Model A" } ]));
            machine = story.document.setup.snapshots;
            settle();
        });

        it("are saved, whether an action plays them or not", function() {
            // a state hiding model A, as the state panel creates it
            const model = story.document.innerComponents.getArray(CVModel2)[0];
            const state: IDeltaState = {
                id: "d1", values: [ false ], curve: EEasingCurve.EaseOutQuad, duration: 1.5, threshold: 0.5,
                title: "State1", paths: [ model.id + "/" + model.ins.visible.key ],
            };
            machine.setState(state);
            machine.deltaStates.push(state);

            expect(savedStates().map(state => state.id)).to.deep.equal([ "d1" ]);
        });
    });
});
