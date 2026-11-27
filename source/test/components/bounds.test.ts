import { expect } from "chai";
import { Box3, BufferGeometry, Float32BufferAttribute, Group, Mesh, Object3D, Vector3 } from "three";

import { expandByGeometryBounds } from "@ff/three/helpers";
import Bracket from "@ff/three/Bracket";
import CPickSelection from "@ff/scene/components/CPickSelection";

import CVModel2 from "client/components/CVModel2";
import CVScene from "client/components/CVScene";
import { EUnitType } from "client/schema/common";

import { createDocumentData, createStory, IStory } from "../helpers/story";

const box = (min: number[], max: number[]) => new Box3(new Vector3().fromArray(min), new Vector3().fromArray(max));
const toArrays = (b: Readonly<Box3>) => ({ min: b.min.toArray().map(round), max: b.max.toArray().map(round) });
const round = (v: number) => Math.round(v * 1e6) / 1e6 + 0; // + 0 turns -0 into 0

/**
 * A mesh whose geometry's bounding box is the given one, with vertices that lie well outside of it:
 * the computed bounds match the given box only if vertices are never read.
 */
function meshWithBox(b: Box3): Mesh
{
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute([ -1000, -1000, -1000, 1000, 1000, 1000 ], 3));
    geometry.boundingBox = b.clone();
    return new Mesh(geometry);
}

const S = Math.SQRT1_2;

/**
 * An octahedron (vertices at ±1 on each axis), rotated around Z (45° by default), with vertices counted as they are read.
 * Its geometry's bounding box rotates into a box that only encloses it: ±√2 in X and Y, where its exact box is ±√½.
 */
function rotatedOctahedron(angle = Math.PI / 4, baked = false): { mesh: Mesh, reads: () => number }
{
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute([ 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1 ], 3));
    if (baked) {
        // the same, with its rotation in its vertices rather than its matrix
        geometry.rotateZ(angle);
    }
    geometry.computeBoundingBox();
    const position = geometry.getAttribute("position") as Float32BufferAttribute;

    let count = 0;
    const getX = position.getX.bind(position);
    position.getX = (index: number) => (++count, getX(index));

    const mesh = new Mesh(geometry);
    mesh.rotation.z = baked ? 0 : angle;
    return { mesh, reads: () => count };
}

const ENCLOSING = { min: [-2 * S, -2 * S, -1].map(round), max: [2 * S, 2 * S, 1].map(round) };
const EXACT = { min: [-S, -S, -1].map(round), max: [S, S, 1].map(round) };

describe("expandByGeometryBounds()", function() {
    it("tells whether the box added is tight", function() {
        const { mesh } = rotatedOctahedron();
        const root = new Group().add(mesh);
        const result = new Box3();
        expect(expandByGeometryBounds(root, result)).to.be.false;
        expect(toArrays(result)).to.deep.equal(ENCLOSING);

        mesh.rotation.z = Math.PI / 2;
        expect(expandByGeometryBounds(root, result.makeEmpty())).to.be.true;
        expect(toArrays(result)).to.deep.equal({ min: [-1, -1, -1], max: [1, 1, 1] });
    });

    it("uses the geometry's bounding box, not its vertices", function() {
        const mesh = meshWithBox(box([-1, -2, -3], [1, 2, 3]));
        const result = new Box3();
        expandByGeometryBounds(mesh, result);
        expect(toArrays(result)).to.deep.equal({ min: [-1, -2, -3], max: [1, 2, 3] });
    });

    it("computes a missing geometry bounding box", function() {
        const geometry = new BufferGeometry();
        geometry.setAttribute("position", new Float32BufferAttribute([ -1, 0, 0, 2, 3, 4 ], 3));
        const result = new Box3();
        expandByGeometryBounds(new Mesh(geometry), result);
        expect(toArrays(result)).to.deep.equal({ min: [-1, 0, 0], max: [2, 3, 4] });
    });

    it("applies children transforms up to the root", function() {
        const root = new Group();
        const mesh = meshWithBox(box([-1, -2, -3], [1, 2, 3]));
        mesh.position.set(10, 0, 0);
        mesh.rotation.set(0, 0, Math.PI / 2); // x -> y, y -> -x
        mesh.scale.setScalar(2);
        root.add(mesh);

        const result = new Box3();
        expandByGeometryBounds(root, result);
        expect(toArrays(result)).to.deep.equal({ min: [6, -2, -6], max: [14, 2, 6] });
    });

    it("leaves out invisible objects and objects on other layers", function() {
        const root = new Group();
        root.add(meshWithBox(box([0, 0, 0], [1, 1, 1])));
        const hidden = meshWithBox(box([5, 5, 5], [6, 6, 6]));
        hidden.visible = false;
        root.add(hidden);
        const helper = meshWithBox(box([-6, -6, -6], [-5, -5, -5]));
        helper.layers.set(1);
        root.add(helper);

        const result = new Box3();
        expandByGeometryBounds(root, result);
        expect(toArrays(result)).to.deep.equal({ min: [0, 0, 0], max: [1, 1, 1] });
    });
});

describe("Scene and model bounds", function() {
    let story: IStory;
    let model: CVModel2;
    let scene: CVScene;
    let selection: CPickSelection;

    /** The bracket CPickSelection attached to the given object, in world space */
    function bracketBox(object: Object3D): { min: number[], max: number[] }
    {
        const bracket = object.children.find(child => child instanceof Bracket) as Bracket;
        expect(bracket, "bracket").to.be.ok;
        bracket.updateWorldMatrix(true, false);
        bracket.geometry.computeBoundingBox();
        return toArrays(bracket.geometry.boundingBox.clone().applyMatrix4(bracket.matrixWorld));
    }

    /**
     * Updates until the scene's bounds catch up with its models. Links from the scene's inputs to its models
     * make a cycle in the update order, which updates the scene first. Drop the second update once links
     * out of inputs no longer order updates.
     */
    function updateBounds()
    {
        story.update();
        story.update();
    }

    /** Gives the model geometry, the way loading a derivative does, without loading anything */
    function displayGeometry(content: Object3D)
    {
        (model as any)._activeDerivative = { model: content };
        model.object3D.add(content);
        (model as any).readVertexBox(content);
        model.composeLocalBoundingBox();
        model.outs.updated.set();
        story.update();
    }

    beforeEach(function() {
        const data = createDocumentData([{ name: "Model A", units: "cm" }]);
        data.models[0].boundingBox = { min: [-1, -2, -3], max: [1, 2, 3] };
        story = createStory(data);
        model = story.document.innerComponents.getArray(CVModel2)[0];
        scene = story.document.innerComponents.getArray(CVScene)[0];
        selection = story.system.getMainComponent(CPickSelection);
        story.update();
    });

    it("start from the document's bounding box", function() {
        expect(toArrays(model.localBoundingBox)).to.deep.equal({ min: [-1, -2, -3], max: [1, 2, 3] });
        expect(toArrays(scene.outs.boundingBox.value)).to.deep.equal({ min: [-1, -2, -3], max: [1, 2, 3] });
    });

    it("come from the geometry on display, without reading vertices", function() {
        displayGeometry(meshWithBox(box([0, 0, 0], [4, 5, 6])));
        expect(toArrays(model.localBoundingBox)).to.deep.equal({ min: [0, 0, 0], max: [4, 5, 6] });
        expect(toArrays(scene.outs.boundingBox.value)).to.deep.equal({ min: [0, 0, 0], max: [4, 5, 6] });
    });

    it("follow geometry moving inside the model (animations)", function() {
        const mesh = meshWithBox(box([0, 0, 0], [1, 1, 1]));
        displayGeometry(mesh);

        mesh.position.set(0, 10, 0);
        scene.ins.sceneTransformed.set(); // what CVActionManager does once an animation is over
        story.update();
        expect(toArrays(scene.outs.boundingBox.value)).to.deep.equal({ min: [0, 10, 0], max: [1, 11, 1] });
    });

    it("follow the model's pose, the node's transform and visibility", function() {
        model.ins.position.setValue([10, 0, 0]);
        model.ins.rotation.setValue([0, 0, 90]);
        updateBounds();
        expect(toArrays(scene.outs.boundingBox.value)).to.deep.equal({ min: [8, -1, -3], max: [12, 1, 3] });

        model.transform.ins.position.setValue([0, 100, 0]);
        updateBounds();
        expect(toArrays(scene.outs.boundingBox.value)).to.deep.equal({ min: [8, 99, -3], max: [12, 101, 3] });

        model.ins.visible.setValue(false);
        updateBounds();
        expect(scene.outs.boundingBox.value.isEmpty()).to.be.true;
    });

    it("follow the scene's units", function() {
        scene.ins.units.setValue(EUnitType.m);
        expect(model.ins.globalUnits.value).to.equal(EUnitType.m);
        updateBounds();
        expect(toArrays(scene.outs.boundingBox.value)).to.deep.equal({ min: [-0.01, -0.02, -0.03], max: [0.01, 0.02, 0.03] });
    });

    it("leave out a model without geometry", function() {
        displayGeometry(new Group());
        expect(toArrays(model.localBoundingBox)).to.deep.equal({ min: [0, 0, 0], max: [0, 0, 0] });
        expect(scene.outs.boundingBox.value.isEmpty()).to.be.true;
    });

    it("are what the model's bracket shows", function() {
        model.ins.rotation.setValue([0, 0, 90]);
        story.update();
        selection.selectComponent(model);
        story.update();
        expect(bracketBox(model.object3D)).to.deep.equal({ min: [-2, -1, -3], max: [2, 1, 3] });

        displayGeometry(meshWithBox(box([0, 0, 0], [4, 5, 6])));
        expect(bracketBox(model.object3D)).to.deep.equal({ min: [-5, 0, 0], max: [0, 4, 6] });
    });

    it("are what the scene's bracket shows, floor or not", function() {
        story.document.setup.floor.ins.visible.setValue(true);
        selection.selectNode(scene.node);
        story.update();
        expect(bracketBox(scene.transform.object3D)).to.deep.equal({ min: [-1, -2, -3], max: [1, 2, 3] });

        // the bracket follows the scene's bounds while selected: brackets update on tick,
        // which comes before the graph's update, so they show the bounds of the previous update
        model.ins.position.setValue([10, 0, 0]);
        story.update();
        story.update();
        expect(bracketBox(scene.transform.object3D)).to.deep.equal({ min: [9, -2, -3], max: [11, 2, 3] });
    });
});

describe("Bounds of geometry rotated inside a model", function() {
    let story: IStory;
    let model: CVModel2;

    /** Displays an octahedron in the model, as loading a derivative does */
    function display(angle?: number, baked?: boolean): { mesh: Mesh, reads: () => number }
    {
        const octahedron = rotatedOctahedron(angle, baked);
        const previous = model.activeDerivative?.model;
        if (previous) {
            model.object3D.remove(previous);
        }
        (model as any)._activeDerivative = { model: octahedron.mesh };
        model.object3D.add(octahedron.mesh);
        (model as any).readVertexBox(octahedron.mesh);
        model.composeLocalBoundingBox();
        return octahedron;
    }

    beforeEach(function() {
        const data = createDocumentData([{ name: "Model A", units: "cm" }]);
        // the box a document holds doesn't matter once geometry is on display
        data.models[0].boundingBox = { min: [-5, -5, -5], max: [5, 5, 5] };
        story = createStory(data);
        model = story.document.innerComponents.getArray(CVModel2)[0];
    });

    it("are read from vertices, once per load", function() {
        const first = display();
        expect(toArrays(model.localBoundingBox)).to.deep.equal(EXACT);
        expect(first.reads()).to.equal(6);

        model.composeLocalBoundingBox();
        story.document.deflateDocument();
        expect(first.reads()).to.equal(6);

        const second = display();
        expect(toArrays(model.localBoundingBox)).to.deep.equal(EXACT);
        expect(second.reads()).to.equal(6);
    });

    it("aren't read from vertices when not rotated", function() {
        const { reads } = display(Math.PI / 2);
        expect(toArrays(model.localBoundingBox)).to.deep.equal({ min: [-1, -1, -1], max: [1, 1, 1] });
        expect(reads()).to.equal(0);
    });

    it("aren't read from vertices when rotations are in the vertices", function() {
        const { reads } = display(Math.PI / 4, true);
        expect(toArrays(model.localBoundingBox)).to.deep.equal(EXACT);
        expect(reads()).to.equal(0);
    });

    it("follow geometry that moved since it was loaded, until it is back", function() {
        const { mesh } = display();
        mesh.rotation.z = Math.PI / 2;
        model.composeLocalBoundingBox();
        expect(toArrays(model.localBoundingBox)).to.deep.equal({ min: [-1, -1, -1], max: [1, 1, 1] });

        mesh.rotation.z = Math.PI / 4;
        model.composeLocalBoundingBox();
        expect(toArrays(model.localBoundingBox)).to.deep.equal(EXACT);
    });

    it("are saved", function() {
        display();
        const { min, max } = story.document.deflateDocument().models[0].boundingBox;
        expect(toArrays(box(min, max))).to.deep.equal(EXACT);
    });
});
