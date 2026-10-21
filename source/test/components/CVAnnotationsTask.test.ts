import { expect } from "chai";
import { Vector3 } from "three";

import CVAnnotationsTask, { EAnnotationsTaskMode } from "client/components/CVAnnotationsTask";
import CVAnnotationView from "client/components/CVAnnotationView";
import CVModel2 from "client/components/CVModel2";
import CVNodeProvider from "client/components/CVNodeProvider";
import Annotation from "client/models/Annotation";
import NVNode from "client/nodes/NVNode";
import { IAction, TActionType } from "client/schema/meta";

import { activateTask, createDocumentData, createStory, IStory } from "../helpers/story";


/** Position of an annotation in world space */
function worldPosition(view: CVAnnotationView, annotation: Annotation)
{
    view.object3D.updateWorldMatrix(true, false);
    return new Vector3().fromArray(annotation.data.position).applyMatrix4(view.object3D.matrixWorld);
}

function closeTo(actual: Vector3, expected: Vector3)
{
    expect(actual.toArray().map(v => +v.toFixed(6))).to.deep.equal(expected.toArray().map(v => +v.toFixed(6)));
}

describe("CVAnnotationsTask", function(){
  let story: IStory;
  let task: CVAnnotationsTask;
  let viewA: CVAnnotationView;
  let viewB: CVAnnotationView;

  beforeEach(function(){
    // model B has other units, a scaled and translated node
    story = createStory(createDocumentData([
      { name: "Model A", units: "cm", meta: 0, annotations: [
        { id: "annoA1", position: [1, 2, 3], direction: [0, 1, 0], scale: 5, offset: 1 },
        { id: "annoA2", position: [0, 0, 1], direction: [0, 0, 1], scale: 5 },
      ]},
      { name: "Model B", units: "mm", translation: [10, 0, 0], scale: 2, annotations: [
        { id: "annoB1", position: [0, 1, 0], direction: [1, 0, 0], scale: 20 },
      ]},
    ], [{ actions: [] }]));

    const views = story.document.innerComponents.getArray(CVAnnotationView);
    viewA = views.find(view => view.node.name === "Model A");
    viewB = views.find(view => view.node.name === "Model B");

    task = activateTask(story, CVAnnotationsTask);
  });

  it("lists the annotations of all models, without an active node", function(){
    expect(story.system.getMainComponent(CVNodeProvider).activeNode).to.equal(null);
    const ids = task.annotationViews.flatMap(view => view.getAnnotations()).map(annotation => annotation.id);
    expect(ids).to.have.members([ "annoA1", "annoA2", "annoB1" ]);
  });

  describe("setActiveAnnotation()", function(){
    it("activates the annotation in its view and deactivates the others", function(){
      task.setActiveAnnotation(viewA.getAnnotationById("annoA1"));
      task.setActiveAnnotation(viewB.getAnnotationById("annoB1"));

      expect(task.activeAnnotations).to.equal(viewB);
      expect(viewB.activeAnnotation.id).to.equal("annoB1");
      expect(viewA.activeAnnotation).to.not.be.ok;
    });

    it("moves the camera to the annotation's view", function(){
      const annotation = viewA.getAnnotationById("annoA1");
      task.setActiveAnnotation(annotation, false);
      task.saveAnnotationView();
      task.setActiveAnnotation(null);

      task.setActiveAnnotation(annotation);

      expect(story.document.setup.snapshots.outs.tweening.value).to.equal(true);
    });

    it("selects the annotation's model as attachment", function(){
      task.setActiveAnnotation(viewB.getAnnotationById("annoB1"));
      story.update();

      expect(task.ins.attachment.schema.options).to.deep.equal([ "Model A", "Model B" ]);
      expect(task.ins.attachment.getOptionText()).to.equal("Model B");
    });
  });

  describe("attachment", function(){
    it("moves the active annotation to another model, keeping its world position", function(){
      const annotation = viewA.getAnnotationById("annoA1");
      task.setActiveAnnotation(annotation);
      story.update();
      const position = worldPosition(viewA, annotation);

      task.ins.attachment.setOption("Model B");
      story.update();

      expect(viewA.getAnnotationById("annoA1")).to.not.be.ok;
      expect(viewB.getAnnotationById("annoA1")).to.equal(annotation);
      expect(task.activeAnnotations).to.equal(viewB);
      expect(viewB.activeAnnotation).to.equal(annotation);
      closeTo(worldPosition(viewB, annotation), position);
    });

    it("keeps the annotation's direction and apparent size", function(){
      const annotation = viewA.getAnnotationById("annoA1");
      const unitScaleA = viewA.getComponent(CVModel2).outs.unitScale.value;
      const unitScaleB = viewB.getComponent(CVModel2).outs.unitScale.value;
      expect(unitScaleA).to.not.equal(unitScaleB);
      task.setActiveAnnotation(annotation);
      story.update();

      task.ins.attachment.setOption("Model B");
      story.update();

      // model B's node is scaled 2x
      const ratio = unitScaleA / (unitScaleB * 2);
      expect(annotation.data.scale).to.be.closeTo(5 * ratio, 1e-9);
      expect(annotation.data.offset).to.be.closeTo(1 * ratio, 1e-9);
      closeTo(new Vector3().fromArray(annotation.data.direction), new Vector3(0, 1, 0));
    });

    it("doesn't move the camera to the annotation's view", function(){
      const snapshots = story.document.setup.snapshots;
      const annotation = viewA.getAnnotationById("annoA1");
      task.setActiveAnnotation(annotation, false);
      task.saveAnnotationView();
      story.update();

      task.ins.attachment.setOption("Model B");
      story.update();

      expect(viewB.activeAnnotation).to.equal(annotation);
      expect(snapshots.outs.tweening.value).to.equal(false);
    });

    it("is saved with its new model", function(){
      task.setActiveAnnotation(viewA.getAnnotationById("annoA1"));
      story.update();
      task.ins.attachment.setOption("Model B");
      story.update();

      const data = story.document.deflateDocument();
      const annotationIds = (name: string) => {
        const node = data.nodes.find(node => node.name === name);
        return (data.models[node.model].annotations || []).map(annotation => annotation.id);
      };
      expect(annotationIds("Model A")).to.deep.equal([ "annoA2" ]);
      expect(annotationIds("Model B")).to.have.members([ "annoB1", "annoA1" ]);
    });
  });

  describe("moving onto another model", function(){
    it("transfers the annotation to the clicked model", function(){
      const annotation = viewA.getAnnotationById("annoA1");
      task.setActiveAnnotation(annotation);
      task.ins.mode.setValue(EAnnotationsTaskMode.Move);
      story.update();

      // position and normal of a click on model B, in its annotation space
      task["moveAnnotation"](viewB, [ 4, 5, 6 ], [ 0, 0, 1 ]);

      expect(viewA.getAnnotationById("annoA1")).to.not.be.ok;
      expect(viewB.getAnnotationById("annoA1")).to.equal(annotation);
      expect(annotation.data.position).to.deep.equal([ 4, 5, 6 ]);
      expect(annotation.data.direction).to.deep.equal([ 0, 0, 1 ]);
      expect(task.activeAnnotations).to.equal(viewB);
    });

    it("moves the annotation within its model", function(){
      const annotation = viewA.getAnnotationById("annoA1");
      task.setActiveAnnotation(annotation);

      task["moveAnnotation"](viewA, [ 4, 5, 6 ], [ 0, 0, 1 ]);

      expect(viewA.getAnnotationById("annoA1")).to.equal(annotation);
      expect(annotation.data.position).to.deep.equal([ 4, 5, 6 ]);
      expect(annotation.data.scale).to.equal(5);
    });
  });

  describe("creating on a model", function(){
    it("adds the annotation to the clicked model", function(){
      task["createAnnotation"](viewB, [ 4, 5, 6 ], [ 0, 0, 1 ]);

      expect(viewB.getAnnotations()).to.have.length(2);
      expect(task.activeAnnotations).to.equal(viewB);
      expect(viewB.activeAnnotation.data.position).to.deep.equal([ 4, 5, 6 ]);
    });

    it("keeps the apparent size of an annotation copied from another model", function(){
      const unitScaleA = viewA.getComponent(CVModel2).outs.unitScale.value;
      const unitScaleB = viewB.getComponent(CVModel2).outs.unitScale.value;
      task.setActiveAnnotation(viewA.getAnnotationById("annoA1"));

      task["createAnnotation"](viewB, [ 4, 5, 6 ], [ 0, 0, 1 ]);

      expect(viewB.activeAnnotation.id).to.not.equal("annoA1");
      expect(viewB.activeAnnotation.data.scale).to.be.closeTo(5 * unitScaleA / (unitScaleB * 2), 1e-9);
    });
  });

  describe("actions", function(){
    // the action belongs to model A's meta, the annotation it targets moved to model B
    function action(type: TActionType, props: Partial<IAction>): IAction
    {
        return { id: "action1", name: "Action", type, trigger: "OnAnnotation", enabled: true, ...props };
    }

    function moveToModelB(id: string)
    {
      task.setActiveAnnotation(viewA.getAnnotationById(id));
      story.update();
      task.ins.attachment.setOption("Model B");
      story.update();
    }

    it("show/hide annotations attached to another model", function(){
      moveToModelB("annoA1");
      const actions = story.document.setup.actions;
      const modelA = viewA.getComponent(CVModel2);

      actions["setAnnotationVisibility"](modelA, action("HideAnnotation", { actionAnnoId: "annoA1" }));
      expect(viewB.getAnnotationById("annoA1").data.visible).to.equal(false);

      actions["setAnnotationVisibility"](modelA, action("ShowAnnotation", { actionAnnoId: "annoA1" }));
      expect(viewB.getAnnotationById("annoA1").data.visible).to.equal(true);
    });

    it("are triggered by annotations attached to another model", function(){
      moveToModelB("annoA1");
      (viewA.node as NVNode).meta.actions.insert(action("HideAnnotation", { annotationId: "annoA1", actionAnnoId: "annoA2" }));

      story.document.setup.viewer.ins.activeAnnotation.setValue("annoA1");
      story.update();

      expect(viewA.getAnnotationById("annoA2").data.visible).to.equal(false);
    });
  });
});
