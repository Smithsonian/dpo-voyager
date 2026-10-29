import { expect } from "chai";
import { Matrix4, Vector3 } from "three";

import Component, { types } from "@ff/graph/Component";
import System from "@ff/graph/System";
import { IPulseContext } from "@ff/graph/components/CPulse";
import { EEasingCurve, IDeltaState, ITweenState } from "@ff/graph/components/CTweenMachine";
import CameraController from "@ff/three/CameraController";
import UniversalCamera from "@ff/three/UniversalCamera";
import threeMath from "@ff/three/math";

import CVSnapshots from "client/components/CVSnapshots";
import CVOrbitNavigation, { EViewPreset } from "client/components/CVOrbitNavigation";
import CVSetup from "client/components/CVSetup";
import CVScene from "client/components/CVScene";
import CVTours from "client/components/CVTours";
import CVAnnotationView from "client/components/CVAnnotationView";
import CVAnnotationsTask from "client/components/CVAnnotationsTask";
import { nearestCameraOrbit } from "client/utils/CameraTransition";

const context = (secondsElapsed: number) => ({ secondsElapsed } as IPulseContext);

class TestProperties extends Component
{
    ins = this.addInputs({
        activeAnnotation: types.String("Annotations.ActiveId"),
        // Deliberately use the same display name as the camera property.
        unrelatedOrbit: types.Vector3("Unrelated.Orbit", [0, 350, 0]),
        enabled: types.Boolean("Settings.Enabled"),
        pivot: types.Vector3("Current.Pivot", [1, 2, 3]),
    });
}

function fixture(orbit = [0, 350, 0])
{
    const node = new System().graph.createNode("Camera transitions");
    const navigation = new CVOrbitNavigation(node, "navigation");
    navigation.ins.orbit.setValue(orbit.slice());
    navigation.ins.offset.setValue([0, 0, 10]);
    navigation.ins.autoZoom.setValue(false);
    const viewerIns = new TestProperties(node, "viewer").ins;
    const setup = new CVSetup(node, "setup");
    setup.navigation = navigation;
    setup.viewer = { ins: viewerIns } as any;
    setup.slicer = { ins: { enabled: viewerIns.enabled } } as any;
    const scene = { outs: { boundingRadius: { value: 10 } } };
    const machine = new CVSnapshots(node, "snapshots");
    setup.snapshots = machine;
    machine.getGraphComponent = ((type) => {
        if (type === CVSetup) { return setup; }
        if (type === CVScene) { return scene; }
        throw new Error("Unexpected graph lookup");
    }) as any;
    // Reorder channels to detect index/name based camera handling.
    const properties = [viewerIns.unrelatedOrbit, navigation.ins.offset,
        viewerIns.activeAnnotation, navigation.ins.orbit];
    properties.forEach(property => machine.addTargetProperty(property));
    (machine as any).getProperty = (id, key) => properties.find(property =>
        property.group.linkable.id === id && property.key === key);
    machine.resetChanged();

    function state(id: string, target = [0, 10, 0], offset = [0, 0, 20]): ITweenState {
        const state = { id, values: [[0, 10, 0], offset, null, target],
            duration: 1, curve: EEasingCurve.Linear, threshold: 0.5 };
        machine.setState(state);
        return state;
    }
    return { node, machine, navigation, viewerIns, setup, scene, state };
}

describe("Camera transitions", function() {
    it("takes the short arc across positive, negative and accumulated turns on all axes", function() {
        const unlimited = [-Infinity, -Infinity, -Infinity];
        const maximum = [Infinity, Infinity, Infinity];
        expect(nearestCameraOrbit([350, -350, 1090], [10, -10, -350], unlimited, maximum))
            .to.deep.equal([370, -370, 1090]);
        expect(nearestCameraOrbit([-179, 179, 0], [179, -179, -180], unlimited, maximum))
            .to.deep.equal([-181, 181, -180]);
        expect(nearestCameraOrbit([0, 0, 0], [180, -180, 360], unlimited, maximum))
            .to.deep.equal([180, -180, 0]);
    });

    it("retains the saved arc when the short arc would cross a finite limit", function() {
        expect(nearestCameraOrbit([0, 350, 0], [0, 10, 0], [-90, 0, 0], [90, 360, 0]))
            .to.deep.equal([0, 10, 0]);
    });

    it("prepares a temporary orbit while ordinary properties still interpolate linearly", function() {
        const { machine, navigation, viewerIns, state } = fixture();
        const saved = state("view");
        const original = JSON.stringify(saved);
        Object.freeze(saved.values[3]);
        machine.tweenTo("view", 10);
        expect(navigation.ins.orbit.value).to.deep.equal([0, 350, 0]);
        machine.tick(context(10.5));
        expect(navigation.ins.orbit.value).to.deep.equal([0, 360, 0]);
        expect(navigation.ins.offset.value).to.deep.equal([0, 0, 15]);
        expect(viewerIns.unrelatedOrbit.value).to.deep.equal([0, 180, 0]);
        machine.tick(context(11));
        expect(navigation.ins.orbit.value).to.deep.equal([0, 370, 0]);
        expect(JSON.stringify(saved)).to.equal(original);
    });

    it("preserves the destination camera matrix, including a panned offset", function() {
        const { machine, navigation, state } = fixture([20, -1090, 350]);
        const target = [25, 10, 10], offset = [5, -3, 20];
        state("view", target, offset);
        machine.tweenTo("view", 0);
        machine.tick(context(1));
        const matrix = (orbit: number[]) => threeMath.composeOrbitMatrix(
            new Vector3().fromArray(orbit).multiplyScalar(threeMath.DEG2RAD), new Vector3().fromArray(offset), new Matrix4());
        const actual = matrix(navigation.ins.orbit.value), expected = matrix(target);
        actual.elements.forEach((value, index) => expect(value).to.be.closeTo(expected.elements[index], 1e-9));
    });

    it("uses the same short arc for the event driven snapshot entry point", function() {
        const { machine, navigation, state } = fixture();
        state("view");
        machine.ins.id.setValue("view");
        machine.ins.tween.set();
        machine.update(context(0));
        machine.tick(context(0.5));
        expect(navigation.ins.orbit.value[1]).to.equal(360);
    });

    it("restarts an interrupted transition from its visible pose without modifying saved views", function() {
        const { machine, navigation, state } = fixture();
        const first = state("first"), second = state("second", [0, -10, 0]);
        const original = JSON.stringify([first, second]);
        machine.tweenTo("first", 0);
        machine.tick(context(0.5));
        machine.tweenTo("second", 0.5);
        machine.tick(context(1));
        expect(navigation.ins.orbit.value[1]).to.equal(355);
        machine.tick(context(1.5));
        expect(navigation.ins.orbit.value[1]).to.equal(350);
        expect(JSON.stringify([first, second])).to.equal(original);
    });

    it("skips null camera channels and tolerates snapshots without camera targets", function() {
        const { machine, navigation, state } = fixture();
        const saved = state("null");
        saved.values[3] = null;
        machine.tweenTo("null", 0);
        machine.tick(context(1));
        expect(navigation.ins.orbit.value[1]).to.equal(350);
        machine.removeTargetProperty(navigation.ins.orbit);
        machine.removeTargetProperty(navigation.ins.offset);
        machine.tweenTo("null", 1);
        machine.tick(context(2));
        expect(navigation.ins.orbit.value[1]).to.equal(350);
    });

    it("instant recall cancels an old tween and applies the saved angles exactly", function() {
        const { machine, navigation, state } = fixture();
        state("moving");
        state("recall", [0, -725, 0]);
        machine.tweenTo("moving", 0);
        machine.tick(context(0.5));
        machine.ins.id.setValue("recall");
        machine.ins.recall.set();
        machine.update(context(0.5));
        expect(machine.outs.tweening.value).to.equal(false);
        expect(machine.tick(context(2))).to.equal(false);
        expect(navigation.ins.orbit.value[1]).to.equal(-725);
    });

    for (const entry of ["Explorer", "editor"]) {
        it(`${entry} annotation playback shares short arc timing and preserves the snapshot`, function() {
            const { machine, navigation, viewerIns, state } = fixture();
            const saved = state("annotation", [0, 10, 0], [0, 0, 10]);
            saved.values[0] = null;
            const original = JSON.stringify(saved);
            const annotation = { data: { id: "selected", viewId: "annotation" } };
            navigation.ins.autoRotation.setValue(true);
            if (entry === "Explorer") {
                // Already selected: exercise the real setter's view activation without UI rendering.
                const view = Object.create(CVAnnotationView.prototype);
                view._activeAnnotation = annotation;
                view.ins = { visible: { value: true } };
                Object.defineProperties(view, {
                    snapshots: { value: machine },
                    arManager: { value: { outs: { isPresenting: { value: false } } } },
                });
                view.getMainComponent = () => ({ context: context(0) });
                view.activeAnnotation = annotation;
            }
            else {
                CVAnnotationsTask.prototype.restoreAnnotationView.call({
                    _machine: machine, _activeAnnotations: { activeAnnotation: annotation },
                    selectedState: "annotation", getMainComponent: () => ({ context: context(0) }),
                } as any);
            }
            machine.tick(context(0.15)); // 0.3 second minimum, linear easing
            expect(navigation.ins.orbit.value[1]).to.equal(360);
            machine.tick(context(0.3));
            expect(navigation.ins.orbit.value[1]).to.equal(370);
            expect(navigation.ins.autoRotation.value).to.equal(false);
            expect(viewerIns.activeAnnotation.value).to.equal("selected");
            expect(JSON.stringify(saved)).to.equal(original);
        });
    }

    it("bounds annotation timing for an empty scene and missing position channels", function() {
        const { machine, navigation, scene, state } = fixture();
        state("stationary", [0, 350, 0], [0, 0, 10]);
        scene.outs.boundingRadius.value = 0;
        machine.tweenToAnnotationView("stationary", 0, "selected");
        machine.tick(context(0.3));
        expect(machine.outs.tweening.value).to.equal(false);
        state("moving");
        machine.tweenToAnnotationView("moving", 1, "selected");
        machine.tick(context(2));
        expect(machine.outs.tweening.value).to.equal(true);
        machine.tick(context(2.5));
        expect(machine.outs.tweening.value).to.equal(false);
        machine.removeTargetProperty(navigation.ins.offset);
        machine.tweenToAnnotationView("moving", 3, "selected");
        machine.tick(context(3.31));
        expect(machine.outs.tweening.value).to.equal(false);
    });

    it("filters annotation camera channels by identity and includes future navigation channels", function() {
        const { node, machine, navigation } = fixture();
        const pivot = new TestProperties(node, "future").ins.pivot;
        machine.addTargetProperty(pivot);
        Object.defineProperty(navigation, "snapshotProperties", { value: [navigation.ins.orbit, navigation.ins.offset, pivot] });
        const values = machine.keepCameraValues(machine.getCurrentValues());
        expect(values).to.deep.equal([null, [0, 0, 10], null, [0, 350, 0], [1, 2, 3]]);
        machine.setState({ id: "pivot", values: [null, null, null, null, [11, 2, 3]],
            duration: 5, curve: EEasingCurve.Linear, threshold: 0.5 });
        machine.tweenToAnnotationView("pivot", 0, "selected");
        machine.tick(context(0.5));
        expect(pivot.value).to.deep.equal([6, 2, 3]);
    });

    for (const cancel of [false, true]) {
        it(`normalizes a reordered delta and restores targets after ${cancel ? "cancellation" : "completion"}`, function() {
            const { machine, navigation } = fixture();
            const originalTargets = machine.getTargetProperties();
            const delta: IDeltaState = { id: "delta", title: "Camera", paths: ["navigation/orbit"],
                values: [[0, 10, 0]], duration: 1, curve: EEasingCurve.Linear, threshold: 0.5 };
            machine.setState(delta);
            machine.addIns.deltaID.setValue("delta");
            machine.addIns.activateDelta.set();
            machine.update(context(0));
            machine.resetChanged();
            machine.tick(context(0.5));
            expect(navigation.ins.orbit.value[1]).to.equal(360);
            expect(delta.values).to.deep.equal([[0, 10, 0]]);
            let completed = false;
            machine.outs.end.once("value", () => completed = true);
            if (cancel) { machine.cancelTween(); }
            else { machine.tick(context(1)); }
            expect(completed).to.equal(!cancel);
            expect(machine.getTargetProperties()).to.deep.equal(originalTargets);
            machine.tick(context(2));
            expect(navigation.ins.orbit.value[1]).to.equal(cancel ? 360 : 370);
        });
    }

    it("viewer reset holds its cached pose after interrupting a transition", function() {
        const { machine, navigation, setup, state } = fixture();
        (setup as any)._savedSetupData = { navigation: navigation.toData() };
        state("moving");
        machine.tweenTo("moving", 0);
        machine.tick(context(0.5));
        setup.ins.restoreState.set();
        setup.update();
        machine.tick(context(2));
        expect(machine.outs.tweening.value).to.equal(false);
        expect(navigation.ins.orbit.value).to.deep.equal([0, 350, 0]);
        expect(navigation.ins.offset.value).to.deep.equal([0, 0, 10]);
    });

    it("reset also cancels a transition that was queued but has not started yet", function() {
        const { machine, navigation, setup, state } = fixture();
        (setup as any)._savedSetupData = { navigation: navigation.toData() };
        state("queued");
        machine.ins.id.setValue("queued");
        machine.ins.tween.set();
        setup.ins.restoreState.set();
        setup.update();
        machine.update(context(0));
        machine.tick(context(2));
        expect(navigation.ins.orbit.value[1]).to.equal(350);
        expect(machine.outs.tweening.value).to.equal(false);
    });

    it("auto rotation remains continuous when it passes a full turn", function() {
        const { navigation } = fixture();
        const controller = (navigation as any)._controller as CameraController;
        controller.orbit.set(0, 359, 0);
        (navigation as any)._scene = { activeCameraComponent: {
            camera: new UniversalCamera(), ins: { projection: { value: navigation.ins.projection.value } },
            transform: { object3D: { matrix: new Matrix4() }, setPropertiesFromMatrix() {} },
        } };
        navigation.ins.autoRotation.setValue(true);
        (navigation as any)._autoRotationStartTime = performance.now() - 2000;
        navigation.tick();
        expect(navigation.ins.orbit.value[1]).to.be.greaterThan(360);
    });

    it("tour first/next/previous steps and exit all pass through the shared transition", function() {
        const { node, machine, navigation, setup, state } = fixture();
        state("first");
        state("second", [0, 350, 0]);
        const tour = new CVTours(node, "tours");
        Object.defineProperties(tour, {
            setup: { value: setup }, snapshots: { value: machine },
            language: { value: { outs: { activeLanguage: { value: 0 } } } },
        });
        const root = document.createElement("div");
        root.attachShadow({ mode: "open" }).innerHTML = '<span id="sceneview-sr"></span>';
        (setup.viewer as any).rootElement = root;
        (tour as any)._tours = [{ titles: {}, leads: {}, steps: ["first", "second"].map(id => ({ id, titles: {}, altTexts: {} })) }];
        tour.resetChanged();
        tour.ins.tourIndex.setValue(0);
        tour.ins.enabled.setValue(true);
        const update = (time: number) => {
            tour.update(context(time));
            tour.resetChanged();
            machine.update(context(time));
            machine.resetChanged();
        };
        update(0);
        machine.tick(context(0.5));
        expect(navigation.ins.orbit.value[1]).to.equal(360);
        machine.tick(context(1));
        tour.ins.next.set();
        update(2);
        machine.tick(context(2.5));
        expect(navigation.ins.orbit.value[1]).to.equal(360);
        machine.tick(context(3));
        tour.ins.previous.set();
        update(4);
        machine.tick(context(4.5));
        expect(navigation.ins.orbit.value[1]).to.equal(360);
        machine.tick(context(5));
        tour.ins.enabled.setValue(false);
        update(6);
        machine.tick(context(7));
        expect(navigation.ins.orbit.value[1]).to.equal(350);
    });

    it("applying a preset or an external pose discards pointer inertia and pending input", function() {
        const { navigation } = fixture();
        const controller = (navigation as any)._controller as CameraController;
        const camera = new UniversalCamera();
        (navigation as any)._scene = { activeCameraComponent: { camera, ins: {
            size: { value: 10 }, far: { value: 1000 }, projection: { setValue() {} },
        } } };
        controller.camera = camera;
        controller.onPointer({ type: "pointer-down", isPrimary: true, source: "mouse",
            originalEvent: { button: 0 }, movementX: 10, movementY: 0, pointerCount: 1 } as any);
        controller.onPointer({ type: "pointer-up", isPrimary: true } as any);
        navigation.ins.preset.setValue(EViewPreset.Front);
        navigation.update();
        expect(controller.update()).to.equal(false);
        expect(controller.orbit.toArray()).to.deep.equal([0, 0, 0]);
        navigation.resetChanged();
        controller.onTrigger({ type: "wheel", wheel: 1 } as any);
        controller.onKeypress({ key: "ArrowLeft" } as any);
        navigation.ins.orbit.setValue([0, 725, 0]);
        navigation.update();
        expect(controller.update()).to.equal(false);
        expect(controller.orbit.toArray()).to.deep.equal([0, 725, 0]);
    });
});
