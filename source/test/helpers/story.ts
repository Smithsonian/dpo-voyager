/**
 * Builds a Voyager Story system the way StoryApplication does, without its UI.
 * Graph updates don't run on their own: call `update()` to process pending property changes.
 */
import System from "@ff/graph/System";
import TypeRegistry from "@ff/core/TypeRegistry";
import CPulse from "@ff/graph/components/CPulse";

import coreTypes from "client/applications/coreTypes";
import explorerTypes from "client/applications/explorerTypes";
import storyTypes from "client/applications/storyTypes";

import NVEngine from "client/nodes/NVEngine";
import NVTools from "client/nodes/NVTools";
import NVDocuments from "client/nodes/NVDocuments";
import NVoyagerStory from "client/nodes/NVoyagerStory";
import NVTasks from "client/nodes/NVTasks";

import CVDocumentProvider from "client/components/CVDocumentProvider";
import CVAssetReader from "client/components/CVAssetReader";
import CVAssetWriter from "client/components/CVAssetWriter";
import CVMediaManager from "client/components/CVMediaManager";
import CVDocument from "client/components/CVDocument";
import CVModel2 from "client/components/CVModel2";
import CVTask from "client/components/CVTask";
import CVTaskProvider from "client/components/CVTaskProvider";
import { ETaskMode } from "client/applications/taskSets";
import { IDocument } from "client/schema/document";
import { TypeOf } from "@ff/core/types";

import documentTemplate from "client/templates/default.svx.json";

// happy-dom has no Web Audio API, which CVAudioManager creates a context of
if (!globalThis.AudioContext) {
    globalThis.AudioContext = class { close() {} decodeAudioData() {} } as any;
}

export interface IStory
{
    system: System;
    document: CVDocument;
    /** Runs one graph update, the given number of seconds after the previous one. */
    update: (seconds?: number) => void;
}

export function createStory(data: IDocument): IStory
{
    const registry = new TypeRegistry();
    registry.add(coreTypes);
    registry.add(explorerTypes);
    registry.add(storyTypes);

    const system = new System(registry);
    system.graph.createCustomNode(NVEngine);
    system.graph.createCustomNode(NVTools);
    system.graph.createCustomNode(NVDocuments);
    system.graph.createCustomNode(NVoyagerStory, "Story");
    system.graph.createCustomNode(NVTasks, "Tasks");

    // no server: text assets (articles) are empty, writes and listings succeed
    system.getMainComponent(CVAssetReader).getText = () => Promise.resolve("");
    system.getMainComponent(CVAssetWriter).putText = () => Promise.resolve();
    system.getMainComponent(CVMediaManager).refresh = () => Promise.resolve();

    const document = system.getMainComponent(CVDocumentProvider).createDocument(data);

    // Explorer's shadow DOM elements some components look up
    const root = window.document.createElement("div");
    root.attachShadow({ mode: "open" }).innerHTML =
        `<div id="sceneview-sr"></div><div class="sv-tag-buttons"></div><div class="ff-viewport-overlay"></div>`;
    document.setup.viewer.rootElement = root;

    // generating an environment map needs a WebGL renderer
    document.setup.environment.ins.enabled.setValue(false);
    // there is no geometry to load
    document.innerComponents.getArray(CVModel2).forEach(model => model.ins.autoLoad.setValue(false));

    const pulse = system.getMainComponent(CPulse);
    let milliseconds = Date.now();
    const update = (seconds = 1 / 60) => pulse.pulse(milliseconds += seconds * 1000);
    update();

    return { system, document, update };
}

/**
 * Creates the authoring tasks and makes the given one active, as clicking its tab does.
 */
export function activateTask<T extends CVTask>(story: IStory, taskType: TypeOf<T>): T
{
    const provider = story.system.getMainComponent(CVTaskProvider);
    if (!story.system.components.has(taskType)) {
        provider.ins.mode.setValue(ETaskMode.Authoring);
        story.update();
    }

    const task = story.system.getMainComponent(taskType);
    provider.activeComponent = task;
    story.update();

    return task;
}

export interface IModelFixture
{
    name: string;
    units?: string;
    translation?: number[];
    scale?: number;
    /** Index in the document's metas */
    meta?: number;
    annotations?: any[];
}

/**
 * A document from the default template, holding the given models.
 */
export function createDocumentData(models: IModelFixture[], metas: any[] = [], sceneMeta?: number): IDocument
{
    const data = JSON.parse(JSON.stringify(documentTemplate));

    data.models = [];
    models.forEach(model => {
        const node: any = { name: model.name, model: data.models.length };
        if (model.translation) {
            node.translation = model.translation;
        }
        if (model.scale) {
            node.scale = [ model.scale, model.scale, model.scale ];
        }
        if (model.meta !== undefined) {
            node.meta = model.meta;
        }
        data.scenes[0].nodes.push(data.nodes.length);
        data.nodes.push(node);

        data.models.push({
            units: model.units || "cm",
            // not a Web3D derivative: nothing gets loaded
            derivatives: [{ usage: "App3D", quality: "High", assets: [{ uri: model.name + ".glb", type: "Model" }] }],
            annotations: model.annotations,
        });
    });

    if (metas.length) {
        data.metas = metas;
    }
    if (sceneMeta !== undefined) {
        data.scenes[0].meta = sceneMeta;
    }

    return data;
}
