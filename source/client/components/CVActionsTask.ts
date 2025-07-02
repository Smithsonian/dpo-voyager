/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import Document from "@ff/core/Document";

import CVTask, { types } from "./CVTask";
import ActionsTaskView from "../ui/story/ActionsTaskView";

import { Node } from "@ff/graph/Component";
import CVDocument from "./CVDocument";
import CVActionManager from "./CVActionManager";
import { EActionTrigger, EActionType, EActionPlayStyle, TActionTrigger, TActionType, TActionPlayStyle } from "client/schema/meta";
import CVMeta from "./CVMeta";
import NVNode from "client/nodes/NVNode";
import CVModel2 from "./CVModel2";
import CVAnnotationView from "./CVAnnotationView";

////////////////////////////////////////////////////////////////////////////////

export default class CVActionsTask extends CVTask
{
    static readonly typeName: string = "CVActionsTask";

    static readonly text: string = "Action";
    static readonly icon: string = "video";

    protected static readonly ins = {
        create: types.Event("Action.Create"),
        delete: types.Event("Action.Delete"),
        activeId: types.String("Action.ActiveId", ""),
        type: types.Enum("Action.Type", EActionType, EActionType.PlayAnimation),
        trigger: types.Enum("Action.Trigger", EActionTrigger, EActionTrigger.OnClick),
        style: types.Enum("Action.Style", EActionPlayStyle, EActionPlayStyle.Single),
        audio: types.Option("Action.Audio", ["None"], 0),
        animation: types.Option("Action.Animation", ["None"], 0),
        annotation: types.Option("Action.Annotation", ["None"], 0),
    };

    protected static readonly outs = {
    };

    ins = this.addInputs<CVTask, typeof CVActionsTask.ins>(CVActionsTask.ins);
    outs = this.addOutputs<CVTask, typeof CVActionsTask.outs>(CVActionsTask.outs);

    actionManager: CVActionManager = null;
    meta: CVMeta = null;

    get actions() {
        return this.meta && this.meta.actions.items;
    }

    constructor(node: Node, id: string)
    {
        super(node, id);
    }

    create()
    {
        super.create();
        this.startObserving();

        this.ins.type.schema.options.pop(); // **REMOVE when audio actions implemented
    }

    dispose()
    {
        this.stopObserving();
        super.dispose();
    }

    createView()
    {
        return new ActionsTaskView(this);
    }

    activateTask()
    {   
        super.activateTask();
        this.meta ? this.synchAnnotationOptions(this.meta.getComponent(CVModel2)) : null;
    }

    deactivateTask()
    {
        super.deactivateTask();
    }

    update()
    {
        const { ins } = this;

        const meta = this.meta;

        if(meta) {

            if(ins.activeId.changed) {
                this.onActionChange();
                return true;
            }

            if (ins.create.changed) {
                const action = { 
                    id: Document.generateId(), 
                    type: EActionType[EActionType.PlayAnimation] as TActionType,
                    trigger: EActionTrigger[EActionTrigger.OnClick] as TActionTrigger,
                    style: EActionPlayStyle[EActionPlayStyle.Single] as TActionPlayStyle,
                    audioId: "",
                    animation: ""
                };
                meta.actions.items = [action];
                ins.activeId.setValue(action.id);
                return true;
            }
            if (ins.delete.changed) {
                meta.actions.remove(ins.activeId.value);
                return true;
            }

            const action = meta.actions.get(ins.activeId.value);
            if (action && (ins.type.changed || ins.trigger.changed || ins.animation.changed || ins.style.changed)) {
                action.type = EActionType[ins.type.value] as TActionType;
                action.trigger = EActionTrigger[ins.trigger.value] as TActionTrigger;
                action.style = EActionPlayStyle[ins.style.value] as TActionPlayStyle;
                action.animation = EActionType[action.type] == EActionType.PlayAnimation ? ins.animation.getOptionText() : "";
                action.audioId = EActionType[action.type] == EActionType.PlayAudio ? action.audioId : "";
            }
            if(ins.audio.changed) {
                const audioManager = this.activeDocument.setup.audio;
                const id = ins.audio.value > 0 ? audioManager.getAudioList()[ins.audio.value - 1].id : "";
                action.audioId = id;
            }
            if(ins.annotation.changed) {
                const id = ins.annotation.value > 0 ? meta.getComponent(CVAnnotationView).getAnnotations()[ins.annotation.value - 1].id : "";
                action.annotationId = id;
            }
            // handle action types UI update
            if(ins.type.changed) {
                if(EActionType[action.type] == EActionType.PlayAnimation) {
                    ins.audio.setValue(null , true, true);
                }
                else {
                    ins.animation.setValue(null , true, true);
                }
            }

            if(action) {
                this.actionManager.stopAction(action);
            }
        }

        return true;
    }

    protected onActionChange()
    {
        const ins = this.ins;
        const action = this.meta && this.meta.actions.get(ins.activeId.value);
        const audioManager = this.activeDocument.setup.audio;

        if(action) {
            ins.type.setValue(EActionType[action.type], true);
            ins.trigger.setValue(EActionTrigger[action.trigger], true);
            ins.animation.setValue(action.animation ? ins.animation.schema.options.indexOf(action.animation) : 0);
            ins.audio.setValue(action.audioId ? audioManager.getAudioList().findIndex(clip => clip.id == action.audioId) + 1 : 0);
            ins.annotation.setValue(action.annotationId ? this.meta.getComponent(CVAnnotationView).getAnnotations().findIndex(anno => anno.id == action.annotationId) + 1 : null);
            ins.style.setValue(action.style ? EActionPlayStyle[action.style] : EActionPlayStyle.Single);
        }
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        const model = next ? next.getComponent(CVModel2, true) : null;

        if (previous) {
            this.meta = null;
        }
        if (model) {
            if (!next.meta) {
                next.createComponent(CVMeta);
            }

            // Load animation options
            const animOptions = ["None"];
            model.object3D.traverse(object => {
                if (object.animations.length > 0) {
                    object.animations.forEach((anim) => {
                        animOptions.push(anim.name);
                    })
                }
            });
            this.ins.animation.setOptions(animOptions);

            this.synchAnnotationOptions(model);
            this.ins.activeId.setValue("");

            this.meta = next.meta;
        }
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        super.onActiveDocument(previous, next);

        if (previous) {
            previous.setup.audio.outs.updated.off("value", this.synchAudioOptions, this);
            this.actionManager = null;
        }
        if (next) {
            this.actionManager = next.setup.actions;
            next.setup.audio.outs.updated.on("value", this.synchAudioOptions, this);
        }
    }

    // Update audio options
    protected synchAudioOptions() {
        const audioManager = this.activeDocument.setup.audio;
        const options = ["None"];
        options.push(...audioManager.getAudioList().map(clip => clip.name));
        this.ins.audio.setOptions(options);
    }

    // Update annotation options
    protected synchAnnotationOptions(model: CVModel2) {
        const annoOptions = ["None"];
        model.getComponent(CVAnnotationView).getAnnotations().forEach((anno) => {
            annoOptions.push(anno.title);
        });
        this.ins.annotation.setOptions(annoOptions);
    }
}