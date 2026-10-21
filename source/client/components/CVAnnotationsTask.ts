/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Vector3, Quaternion, Matrix4, Matrix3, Mesh } from "three";

import * as helpers from "@ff/three/helpers";

import { Node, types, IComponentEvent } from "@ff/graph/Component";
import { IPointerEvent } from "@ff/scene/RenderView";
import Notification from "@ff/ui/Notification";

import Annotation from "../models/Annotation";

import CVDocument from "./CVDocument";
import CVTask from "./CVTask";
import CVModel2 from "./CVModel2";
import CVAnnotationView, { IAnnotationsUpdateEvent, IAnnotationClickEvent } from "./CVAnnotationView";

import AnnotationsTaskView from "../ui/story/AnnotationsTaskView";
import CVScene from "client/components/CVScene";
import { getMeshTransform } from "client/utils/Helpers";
import CVSnapshots, { EEasingCurve } from "./CVSnapshots";
import CPulse from "@ff/graph/components/CPulse";

////////////////////////////////////////////////////////////////////////////////

const _position = new Vector3();
const _direction = new Vector3();
const _scaling = new Vector3();
const _quat = new Quaternion();
const _mat4 = new Matrix4();
const _mat3 = new Matrix3();

export enum EAnnotationsTaskMode { Off, Move, Create }

/**
 * Computes the transform from the annotation space of source to the annotation space of target.
 */
function getRelativeTransform(source: CVAnnotationView, target: CVAnnotationView, result: Matrix4): Matrix4
{
    source.object3D.updateWorldMatrix(true, false);
    target.object3D.updateWorldMatrix(true, false);
    return result.copy(target.object3D.matrixWorld).invert().multiply(source.object3D.matrixWorld);
}

export default class CVAnnotationsTask extends CVTask
{
    static readonly typeName: string = "CVAnnotationsTask";

    static readonly text: string = "Annotations";
    static readonly icon: string = "comment";

    protected static readonly ins = {
        mode: types.Enum("Mode", EAnnotationsTaskMode, EAnnotationsTaskMode.Off),
        audio: types.Option("Annotation.Audio", ["None"], 0),
        attachment: types.Option("Annotation.Attachment", []),
        selection: types.Event("Annotation.Selection")
    };


    ins = this.addInputs<CVTask, typeof CVAnnotationsTask.ins>(CVAnnotationsTask.ins);

    private _defaultScale = 1;
    private _machine: CVSnapshots = null;
    // annotation views matching the options of ins.attachment
    private _attachmentViews: CVAnnotationView[] = [];

    constructor(node: Node, id: string)
    {
        super(node, id);

        const configuration = this.configuration;
        configuration.annotationsVisible = true;
        configuration.gridVisible = false;
        configuration.interfaceVisible = true;
        configuration.bracketsVisible = false;
    }

    /**
     * All annotation views of the active document.
     */
    get annotationViews(): Readonly<CVAnnotationView[]> {
        return this.activeDocument ? this.activeDocument.innerComponents.getArray(CVAnnotationView) : [];
    }

    /**
     * The annotation view holding the active annotation.
     */
    get activeAnnotations() {
        return this.annotationViews.find(view => !!view.activeAnnotation) || null;
    }

    get selectedState() {
        return this.activeAnnotations.activeAnnotation.data.viewId;
    }

    /**
     * Makes the given annotation the active one, deselecting annotations in all other views.
     */
    setActiveAnnotation(annotation: Annotation, activateView = true)
    {
        const views = this.annotationViews;
        const owner = annotation ? views.find(view => view.getAnnotationById(annotation.id) === annotation) : null;

        // deselect first so that only one view holds an active annotation when update events fire
        views.forEach(view => view !== owner && view.setActiveAnnotation(null));
        if (owner) {
            owner.setActiveAnnotation(annotation, activateView);
        }

        this.emitUpdateEvent();
    }

    createView()
    {
        return new AnnotationsTaskView(this);
    }

    activateTask()
    {
        this.startObserving();
        super.activateTask();
        this.synchAudioOptions();
    }

    deactivateTask()
    {
        this.stopObserving();

        super.deactivateTask();
    }

    update(context)
    {
        const {ins} = this;
        
        if(!this.activeDocument) {
            return false;
        }

        if (ins.mode.changed) {
            this.emitUpdateEvent();
        }

        if(ins.audio.changed && this.activeAnnotations) {
            const audioManager = this.activeDocument.setup.audio;
            const id = ins.audio.value > 0 ? audioManager.getAudioList()[ins.audio.value - 1].id : "";
            if(id != audioManager.narrationId || id == "") {
                this.activeAnnotations.ins.audioId.setValue(id);
            }
            else {
                ins.audio.setValue(0);  // set to none
                Notification.show("Narration audio cannot be used in an annotation.", "warning");
            }
        }

        if(ins.attachment.changed) {
            const target = this._attachmentViews[ins.attachment.getValidatedValue()];
            if (target) {
                this.reattachAnnotation(target);
            }
        }

        if(ins.selection.changed) {
            this.setAudio();
            this.synchAttachmentOptions();
        }

        return true;
    }

    removeAnnotation()
    {
        const annotations = this.activeAnnotations;

        if (annotations) {
            const annotation = annotations.activeAnnotation;
            if (annotation) {
                annotations.removeAnnotation(annotation);
            }
        }
    }

    saveAnnotationView()
    {
        const machine = this._machine;
        const props = machine.getTargetProperties();
        const orbitIdx = props.findIndex((elem) => {return elem.name == "Orbit"});
        const offsetIdx = props.findIndex((elem) => {return elem.name == "Offset"});

        // set non camera properties to null to skip them
        const values = machine.getCurrentValues();
        values.forEach((v, idx) => {
            if(idx != orbitIdx && idx != offsetIdx) {
                values[idx] = null;
            }
        });

        const id = machine.setState({
            values: values,
            curve: EEasingCurve.EaseOutQuad,
            duration: 1.0,
            threshold: 0.5,
        });

        const annotation = this.activeAnnotations.activeAnnotation;
        annotation.set("viewId", id);
        this.activeAnnotations.updateAnnotation(annotation, true);

    }

    restoreAnnotationView()
    {
        const machine = this._machine;
        const annotation = this.activeAnnotations.activeAnnotation;
        
        // If activeAnnotation is being tracked, make sure it is set
        const activeIdx = machine.getTargetProperties().findIndex(prop => prop.name == "ActiveId");
        if(activeIdx >= 0) {
            const viewState = machine.getState(this.selectedState);
            viewState.values[activeIdx] = annotation.data.id;
        }
        
        const pulse = this.getMainComponent(CPulse);
        machine.tweenTo(this.selectedState, pulse.context.secondsElapsed);
    }

    deleteAnnotationView()
    {
        const machine = this._machine;
        machine.deleteState(this.selectedState);
        const annotation = this.activeAnnotations.activeAnnotation;
        annotation.set("viewId", "");
        this.activeAnnotations.updateAnnotation(annotation, true);
    }

    protected onPointerUp(event: IPointerEvent)
    {
        // do not handle event if user is dragging (the camera)
        if (event.isDragging) {
            return;
        }

        const mode = this.ins.mode.getValidatedValue();
        if (mode === EAnnotationsTaskMode.Off) {
            return;
        }

        // user clicked on a model: annotations are created on or moved to that model
        const model = event.component as CVModel2;
        const annotations = model.getComponent(CVAnnotationView, true);
        if (!annotations) {
            return;
        }

        // get click position and normal in annotation space = pose transform * model space
        _position.fromArray(model.ins.position.value);
        helpers.degreesToQuaternion(model.ins.rotation.value, CVModel2.rotationOrder, _quat);
        _scaling.setScalar(1);
        _mat4.compose(_position, _quat, _scaling);

        const meshTransform = getMeshTransform(model.object3D, event.object3D);
        const invMeshTransform = meshTransform.clone().invert();
        // Get local bounding box
        const bounds = (event.object3D as Mesh).geometry.boundingBox.clone();

        // add mesh parent transforms in this branch
        _mat4.copy(_mat4.multiply(invMeshTransform));   
        _mat3.getNormalMatrix(_mat4);

        const position = event.view.pickPosition(event, bounds).applyMatrix4(_mat4).toArray();
        const normal = event.view.pickNormal(event).applyMatrix3(_mat3).toArray();

        if (mode === EAnnotationsTaskMode.Create) {
            this.createAnnotation(annotations, position, normal);
        }
        else if (mode === EAnnotationsTaskMode.Move) {
            this.moveAnnotation(annotations, position, normal);
        }

        event.stopPropagation = true;
    }

    protected createAnnotation(annotations: CVAnnotationView, position: number[], direction: number[])
    {
        const languageManager = this.activeDocument.setup.language;
        const primarySceneLanguage = languageManager.ins.primarySceneLanguage.value;

        const activeAnnotations = this.activeAnnotations;
        const activeAnnotation = activeAnnotations && activeAnnotations.activeAnnotation;
        let template = undefined;

        if (activeAnnotation) {
            template = activeAnnotation.toJSON();
            template.id = Annotation.generateId();
        }

        const model = annotations.getComponent(CVModel2);
        const annotation = new Annotation(template);
        annotation.language = primarySceneLanguage;

        const data = annotation.data;
        data.position = position;
        data.direction = direction;

        if (!template) {
            const scene = this.getSystemComponent(CVScene);
            this._defaultScale = scene.outs.boundingRadius.value * 0.05;
            data.scale = this._defaultScale * (1 / model.outs.unitScale.value);
        }
        else if (activeAnnotations !== annotations) {
            // template comes from another model: keep its apparent size
            const scale = getRelativeTransform(activeAnnotations, annotations, _mat4).getMaxScaleOnAxis();
            data.scale *= scale;
            data.offset *= scale;
        }

        annotations.addAnnotation(annotation);
        this.setActiveAnnotation(annotation);

        languageManager.ins.activeLanguage.setValue(primarySceneLanguage);
    }

    /**
     * Moves the active annotation to the given position and direction, expressed in the space of the given
     * annotation view. If the annotation belongs to another view, it is transferred to the given view.
     */
    protected moveAnnotation(annotations: CVAnnotationView, position: number[], direction: number[])
    {
        const source = this.activeAnnotations;
        const annotation = source && source.activeAnnotation;
        if (!annotation) {
            return;
        }

        const data = annotation.data;

        if (source !== annotations) {
            const scale = getRelativeTransform(source, annotations, _mat4).getMaxScaleOnAxis();
            data.scale *= scale;
            data.offset *= scale;
        }

        data.position = position;
        data.direction = direction;
        annotation.update();

        if (source !== annotations) {
            this.transferAnnotation(annotation, source, annotations);
        }
        else {
            annotations.updateAnnotation(annotation);
            this.emitUpdateEvent();
        }
    }

    /**
     * Attaches the active annotation to the given annotation view, keeping its position in world space.
     */
    protected reattachAnnotation(annotations: CVAnnotationView)
    {
        const source = this.activeAnnotations;
        const annotation = source && source.activeAnnotation;
        if (!annotation || source === annotations) {
            return;
        }

        const transform = getRelativeTransform(source, annotations, _mat4);
        const scale = transform.getMaxScaleOnAxis();
        const data = annotation.data;

        data.position = _position.fromArray(data.position).applyMatrix4(transform).toArray();
        data.direction = _direction.fromArray(data.direction).transformDirection(transform).toArray();
        data.scale *= scale;
        data.offset *= scale;
        annotation.update();

        this.transferAnnotation(annotation, source, annotations);
    }

    protected transferAnnotation(annotation: Annotation, source: CVAnnotationView, target: CVAnnotationView)
    {
        // deactivate before removal, else the source view activates its next annotation
        source.setActiveAnnotation(null);
        source.removeAnnotation(annotation);
        target.addAnnotation(annotation);

        // don't tween to the annotation's view: the user is editing it, not viewing it
        this.setActiveAnnotation(annotation, false);
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        super.onActiveDocument(previous, next);

        if(previous) {
            previous.setup.audio.outs.updated.off("value", this.synchAudioOptions, this);
            previous.setup.language.outs.activeLanguage.off("value", this.update, this);

            const components = previous.innerGraph.components;
            components.off(CVModel2, this.onModelComponent, this);
            components.off(CVAnnotationView, this.onAnnotationsComponent, this);
            components.getArray(CVModel2).forEach(model => this.onModelComponent({ type: model.typeName, object: model, add: false, remove: true }));
            components.getArray(CVAnnotationView).forEach(view => {
                this.onAnnotationsComponent({ type: view.typeName, object: view, add: false, remove: true });
                view.activeAnnotation = null;
            });

            this._machine = null;
        }
        if (next) {          
            next.setup.language.outs.activeLanguage.on("value", this.update, this);
            next.setup.audio.outs.updated.on("value", this.synchAudioOptions, this);

            const components = next.innerGraph.components;
            components.on(CVModel2, this.onModelComponent, this);
            components.on(CVAnnotationView, this.onAnnotationsComponent, this);
            components.getArray(CVModel2).forEach(model => this.onModelComponent({ type: model.typeName, object: model, add: true, remove: false }));
            components.getArray(CVAnnotationView).forEach(view => this.onAnnotationsComponent({ type: view.typeName, object: view, add: true, remove: false }));

            this._machine = next.setup.snapshots;
        }

        this.emitUpdateEvent();
    }

    protected onModelComponent(event: IComponentEvent<CVModel2>)
    {
        const model = event.object;

        if (event.add) {
            model.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
        }
        else if (event.remove) {
            model.off<IPointerEvent>("pointer-up", this.onPointerUp, this);
        }
    }

    protected onAnnotationsComponent(event: IComponentEvent<CVAnnotationView>)
    {
        const annotations = event.object;

        if (event.add) {
            annotations.on<IAnnotationClickEvent>("click", this.onAnnotationClick, this);
            annotations.on<IAnnotationsUpdateEvent>("annotation-update", this.emitUpdateEvent, this);
        }
        else if (event.remove) {
            annotations.off<IAnnotationsUpdateEvent>("annotation-update", this.emitUpdateEvent, this);
            annotations.off<IAnnotationClickEvent>("click", this.onAnnotationClick, this);
        }

        this.emitUpdateEvent();
    }

    protected emitUpdateEvent()
    {
        this.emit("update");
        this.ins.selection.set();
    }

    // Handles annotation selection in outside of task.
    protected onAnnotationClick(event: IAnnotationClickEvent) 
    {
        // HACK to blur potentially selected textboxes when an annotation
        // is clicked outside of the task UI and is consumed before getting here.
        const textboxes = document.getElementsByClassName("ff-text-edit");
        for(let box of textboxes) {
            (box as HTMLElement).blur();
        }
    }

    // Update audio options
    protected synchAudioOptions() {
        const audioManager = this.activeDocument.setup.audio;
        const options = ["None"];
        options.push(...audioManager.getAudioList().map(clip => clip.name));
        this.ins.audio.setOptions(options);
    }

    // Update attachment options and value
    protected synchAttachmentOptions() {
        const views = this._attachmentViews = this.annotationViews.slice();
        const options = views.map(view => view.node.name || view.node.displayName);
        const prop = this.ins.attachment;

        if (options.join("\n") !== prop.schema.options.join("\n")) {
            prop.setOptions(options);
        }

        const index = views.indexOf(this.activeAnnotations);
        if (index >= 0 && index !== prop.value) {
            prop.setValue(index, true);
        }
    }

    // Update audio value
    protected setAudio() {
        const annotations = this.activeAnnotations;
        if(annotations) {
            const audioManager = this.activeDocument.setup.audio;
            const audio = audioManager.getAudioClip(annotations.ins.audioId.value);
            this.ins.audio.setValue(audio ? audioManager.getAudioList().indexOf(audio)+1 : 0);
        }
    }
}