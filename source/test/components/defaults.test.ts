import { expect } from "chai";

import Property from "@ff/graph/Property";
import { EShadowMapResolution } from "@ff/scene/components/CLight";
import { EBackgroundStyle } from "@ff/scene/components/CBackground";

import { IDocument } from "client/schema/document";
import CVNode from "client/components/CVNode";
import CVCamera from "client/components/CVCamera";
import CVModel2 from "client/components/CVModel2";
import CVSpotLight from "client/components/lights/CVSpotLight";
import CVPointLight from "client/components/lights/CVPointLight";
import CVSunLight from "client/components/lights/CVSunLight";
import Annotation from "client/models/Annotation";
import { EEasingCurve } from "@ff/core/easing";

import { createStory, createDocumentData, IStory } from "../helpers/story";

// The setup features whose state is held in input properties
const features = [
    "interface", "reader", "viewer", "navigation", "derivatives", "background",
    "environment", "language", "floor", "grid", "tape", "slicer",
];

// Required by the JSON schema, so never missing in a valid document
const requiredViewer = { shader: "Default", exposure: 1, gamma: 2 };

function propertyValues(story: IStory, feature: string): Record<string, string>
{
    const values = {};
    story.document.setup[feature].ins.properties.forEach((property: Property) => {
        if (!property.schema.event && property.schema.objectType === undefined) {
            values[property.key] = JSON.stringify(property.value);
        }
    });
    return values;
}

/** Saves and reloads the story's document. */
function reload(story: IStory): IStory
{
    const data = story.document.deflateDocument();
    // models are never loaded here: their bounding box is empty (infinite) and fails validation
    data.models.forEach(model => delete model.boundingBox);
    return createStory(data);
}

function lightDocument(lights: any[]): IDocument
{
    const data = createDocumentData([{ name: "Model" }]);
    lights.forEach(light => {
        data.nodes[1].children.push(data.nodes.length);
        data.nodes.push({ name: light.type, light: data.lights.length });
        data.lights.push(light);
    });
    return data;
}

describe("Deserialization defaults", function() {

    describe("setup features", function() {
        it("load the same values whether a field or its whole section is missing", function() {
            const noSections = createDocumentData([{ name: "Model" }]);
            noSections.setups[0] = {} as any;

            const emptySections = createDocumentData([{ name: "Model" }]);
            emptySections.setups[0] = {} as any;
            features.forEach(feature => emptySections.setups[0][feature] = {});
            emptySections.setups[0].viewer = requiredViewer as any;

            const absent = createStory(noSections);
            const empty = createStory(emptySections);

            const deviations = [];
            features.forEach(feature => {
                const absentValues = propertyValues(absent, feature);
                const emptyValues = propertyValues(empty, feature);
                Object.keys(absentValues).forEach(key => {
                    const path = `${feature}.${key}`;
                    if (absentValues[key] !== emptyValues[key]) {
                        deviations.push(`${path}: ${absentValues[key]} != ${emptyValues[key]}`);
                    }
                });
            });

            expect(deviations).to.deep.equal([]);
        });

        it("background: defaults to a radial gradient", function() {
            const data = createDocumentData([{ name: "Model" }]);
            data.setups[0].background = {} as any;
            const background = createStory(data).document.setup.background;

            expect(background.ins.style.value).to.equal(EBackgroundStyle.RadialGradient);
        });

        it("floor and grid: hidden by preset, floor receives shadows by preset", function() {
            const data = createDocumentData([{ name: "Model" }]);
            data.setups[0].floor = {} as any;
            data.setups[0].grid = {} as any;
            const { floor, grid } = createStory(data).document.setup;

            expect(floor.ins.visible.value).to.equal(false);
            expect(floor.ins.visible.isDefault()).to.equal(true);
            expect(floor.ins.receiveShadow.value).to.equal(true);
            expect(floor.ins.receiveShadow.isDefault()).to.equal(true);
            expect(grid.ins.visible.value).to.equal(false);
            expect(grid.ins.visible.isDefault()).to.equal(true);
        });

        it("floor and grid presets don't leak into other objects", function() {
            const { tape } = createStory(createDocumentData([{ name: "Model" }])).document.setup;

            expect(tape.ins.visible.schema.preset).to.equal(true);
        });

        it("tape: loads a boolean visibility when 'enabled' is missing", function() {
            const data = createDocumentData([{ name: "Model" }]);
            data.setups[0].tape = { markerStyle: "Pin" } as any;
            const story = createStory(data);
            const tape = story.document.setup.tape;

            tape.fromData({ markerStyle: "Pin" } as any);
            expect(tape.ins.visible.value).to.equal(false);
            expect(tape.toData().enabled).to.equal(false);
        });

        it("slicer: flags restored values as changed", function() {
            const story = createStory(createDocumentData([{ name: "Model" }]));
            const slicer = story.document.setup.slicer;

            slicer.fromData({ enabled: true } as any);
            expect(slicer.ins.enabled.changed).to.equal(true);
            expect(slicer.ins.enabled.value).to.equal(true);
            expect(slicer.ins.color.value).to.not.equal(slicer.ins.color.schema.preset);
        });
    });

    describe("lights", function() {
        it("round-trip a 'Low' shadow resolution", function() {
            const lights = [
                { type: "spot", shadowEnabled: true, shadowResolution: "Low", spot: {} },
                { type: "point", shadowEnabled: true, shadowResolution: "Low", point: {} },
            ];
            const story = reload(createStory(lightDocument(lights)));

            const spot = story.document.innerComponents.getArray(CVSpotLight)[0];
            const point = story.document.innerComponents.getArray(CVPointLight)[0];
            expect(spot.ins.shadowResolution.value).to.equal(EShadowMapResolution.Low);
            expect(point.ins.shadowResolution.value).to.equal(EShadowMapResolution.Low);
        });

        it("round-trip a zero spot penumbra", function() {
            const story = reload(createStory(lightDocument([{ type: "spot", spot: { penumbra: 0 } }])));

            const spot = story.document.innerComponents.getArray(CVSpotLight)[0];
            expect(spot.ins.penumbra.value).to.equal(0);
        });
    });

    it("sun light: round-trips its tags", function() {
        const story = reload(createStory(lightDocument([{ type: "sun", tags: "outdoor" }])));
        const sun = story.document.innerComponents.getArray(CVSunLight)[0];
        expect(sun.ins.tags.value).to.equal("outdoor");
    });

    describe("snapshot states", function() {
        it("use the tween machine presets for missing fields, and don't save them", function() {
            const story = createStory(createDocumentData([{ name: "Model" }]));
            const snapshots = story.document.setup.snapshots;
            const { curve, duration, threshold } = snapshots.ins;

            expect(curve.schema.preset).to.equal(EEasingCurve.EaseQuad);
            snapshots.fromData({ targets: [], states: [{ id: "a", values: [] }] } as any, new Map());
            const state = snapshots.getState("a");
            expect([ state.curve, state.duration, state.threshold ])
                .to.deep.equal([ curve.schema.preset, duration.schema.preset, threshold.schema.preset ]);
        });
    });

    describe("annotations", function() {
        it("load missing fields as their defaults and don't save them", function() {
            const annotation = new Annotation({ id: "a", position: [ 0, 0, 0 ], direction: [ 0, 1, 0 ] } as any);
            const { defaults } = Annotation;

            expect(annotation.data).to.include({ ...defaults, color: annotation.data.color, style: Annotation.defaultStyle });
            expect(annotation.data.color).to.deep.equal(defaults.color);
            expect(Object.keys(annotation.toJSON())).to.have.members([ "id", "position", "direction" ]);
        });

        it("don't share the default color between annotations", function() {
            const a = new Annotation();
            a.data.color[0] = 1;
            expect(new Annotation().data.color[0]).to.equal(0);
        });
    });

    describe("nodes", function() {
        it("load a missing rotation as a 3-component euler vector", function() {
            const story = createStory(createDocumentData([{ name: "Model" }]));
            const transform = story.document.innerComponents.getArray(CVNode)
                .find(transform => transform.node.name === "Model");

            expect(transform.ins.rotation.value).to.deep.equal([ 0, 0, 0 ]);
            expect(transform.ins.rotation.isDefault()).to.equal(true);
        });
    });

    describe("cameras", function() {
        it("use the property preset for a missing zfar", function() {
            const data = createDocumentData([{ name: "Model" }]);
            data.cameras[0].perspective = { yfov: 52, znear: 0.1 } as any;
            data.cameras[0].autoNearFar = false;
            const camera = createStory(data).document.innerComponents.getArray(CVCamera)[0];

            expect(camera.ins.far.value).to.equal(camera.ins.far.schema.preset);
        });
    });

    describe("models", function() {
        it("reset a material override and overlay set after loading", function() {
            const story = createStory(createDocumentData([{ name: "Model" }]));
            const model = story.document.innerComponents.getArray(CVModel2)[0];

            model.ins.override.setValue(true);
            model.ins.opacity.setValue(0.3);
            model.ins.overlayMap.setValue(1);
            model.fromSavedDocumentState();

            expect(model.ins.override.value).to.equal(false);
            expect(model.ins.opacity.value).to.equal(model.ins.opacity.schema.preset);
            expect(model.ins.overlayMap.value).to.equal(0);
        });
    });
});
