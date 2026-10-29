/**
 * Runs a headless ExplorerApplication whose network is under the test's control:
 * files are served by a fetch() stub, models and textures by CVAssetReader.getModel() and getTexture() stubs.
 * Graph updates don't run on their own: call `update()` or `settle()`.
 */
// before any module importing a stylesheet
import "./ignoreStyles.cjs";

import { Group, Texture } from "three";

import CPulse from "@ff/graph/components/CPulse";

import ExplorerApplication from "client/applications/ExplorerApplication";
import CVAssetManager from "client/components/CVAssetManager";
import CVAssetReader from "client/components/CVAssetReader";
import CVDocument from "client/components/CVDocument";
import CVDocumentProvider, { IActiveDocumentEvent } from "client/components/CVDocumentProvider";
import { IDocument } from "client/schema/document";

import documentTemplate from "client/templates/default.svx.json";

// happy-dom has no Web Audio API, which CVAudioManager creates a context of
if (!globalThis.AudioContext) {
    globalThis.AudioContext = class { close() {} decodeAudioData() {} } as any;
}

/** A response under the test's control. Rejects with the request's abort reason once aborted. */
export class Deferred<T>
{
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;

    constructor(signal?: AbortSignal)
    {
        this.promise = new Promise<T>((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
        signal?.addEventListener("abort", () => this.reject(signal.reason));
    }
}

/**
 * How the stubs answer a request: a document, a text file, a model, a texture, an error,
 * or a response the test settles itself.
 */
export type TResponse = IDocument | { text: string } | "model" | "texture" | Error | "deferred";

export interface IViewerEvent
{
    type: string;
    detail: any;
    /** The document whose viewer dispatched the event. */
    document: CVDocument;
}

export interface IExplorer
{
    app: ExplorerApplication;
    assetManager: CVAssetManager;
    readonly document: CVDocument;
    /**
     * Answers to requests, by file name. Missing files are 404s, except for empty language strings.
     * Missing models and textures load.
     */
    responses: Map<string, TResponse>;
    /** Requests waiting on a "deferred" response, by file name. */
    pending: Map<string, Deferred<any>>;
    /** "scene-*" and "model-*" events dispatched by viewers. */
    events: IViewerEvent[];
    /** Runs one graph update. */
    update: () => void;
    /** Alternates graph updates and macrotasks until no new event is dispatched. */
    settle: () => Promise<void>;
}

const _observed = [ "model-load", "model-error", "scene-content-load", "scene-load", "scene-error" ];

export function createExplorer(): IExplorer
{
    const responses = new Map<string, TResponse>();
    const pending = new Map<string, Deferred<any>>();
    const events: IViewerEvent[] = [];

    const respond = <T>(name: string, signal: AbortSignal, answer: (response: TResponse) => T): Promise<T> => {
        // the interface's strings are not what tests are about
        const response = responses.get(name) ?? (name.startsWith("string.resources.") ? {} as IDocument : undefined);
        if (response === "deferred") {
            const deferred = new Deferred<T>(signal);
            pending.set(name, deferred);
            return deferred.promise;
        }
        return response instanceof Error ? Promise.reject(response) : Promise.resolve(answer(response));
    };

    globalThis.fetch = (async (url: string, { signal }: RequestInit = {}) => {
        const name = new URL(url, window.location.href).pathname.split("/").pop();
        return respond(name, signal, response => response === undefined
            ? new Response("not found", { status: 404, statusText: "Not Found" })
            : new Response(typeof response === "object" && "text" in response ? response.text : JSON.stringify(response)));
    }) as any;

    // without its splash message
    const log = console.log;
    console.log = () => {};
    const app = new ExplorerApplication(null, {}, false);
    console.log = log;
    const system = app.system;
    const pulse = system.getMainComponent(CPulse);
    pulse.stop();

    system.getMainComponent(CVAssetReader).getModel = (path: string, { signal }: { signal?: AbortSignal } = {}) =>
        respond(path, signal, () => new Group());
    system.getMainComponent(CVAssetReader).getTexture = (path: string, { signal }: { signal?: AbortSignal } = {}) =>
        respond(path, signal, () => new Texture());

    const documentProvider = system.getMainComponent(CVDocumentProvider);
    let milliseconds = Date.now();

    // Attaches each document's viewer to its own element, as MainView does for the active one
    const attach = (document: CVDocument) => {
        const root = window.document.createElement("div");
        // Explorer's shadow DOM elements some components look up
        root.attachShadow({ mode: "open" }).innerHTML =
            `<div id="sceneview-sr"></div><div class="sv-tag-buttons"></div><div class="ff-viewport-overlay"></div>`;
        _observed.forEach(type => root.addEventListener(type, (event: CustomEvent) =>
            events.push({ type, detail: event.detail, document })));
        document.setup.viewer.rootElement = root;
        // generating an environment map needs a WebGL renderer
        (document.setup.environment as any).loadEnvironmentMap = () => {};
    };
    documentProvider.scopedComponents.forEach(attach);
    documentProvider.on<IActiveDocumentEvent>("active-component", ({ next }) =>
        next && !next.setup.viewer.rootElement && attach(next));

    const update = () => pulse.pulse(milliseconds += 1000 / 60);

    const settle = async () => {
        let count: number;
        do {
            count = events.length;
            for (let i = 0; i < 4; ++i) {
                update();
                await new Promise(resolve => setTimeout(resolve));
            }
        } while (count !== events.length);
    };

    return {
        app,
        assetManager: system.getMainComponent(CVAssetManager),
        get document() { return documentProvider.activeComponent; },
        responses,
        pending,
        events,
        update,
        settle,
    };
}

export interface IModelFixture
{
    name: string;
    /** Qualities of the model's Web3D derivatives, each served from "<name>-<quality>.glb". */
    qualities?: string[];
    autoLoad?: boolean;
}

/**
 * A document from the default template, holding the given models.
 */
export function createDocumentData(models: IModelFixture[]): IDocument
{
    const data = JSON.parse(JSON.stringify(documentTemplate));

    data.models = [];
    models.forEach(model => {
        data.scenes[0].nodes.push(data.nodes.length);
        data.nodes.push({ name: model.name, model: data.models.length });
        data.models.push({
            units: "cm",
            derivatives: (model.qualities || [ "High" ]).map(quality => ({
                usage: "Web3D",
                quality,
                assets: [{ uri: `${model.name}-${quality}.glb`, type: "Model" }],
            })),
        });
    });

    // the schema wants at least one model, if any
    if (!data.models.length) {
        delete data.models;
    }

    return data;
}

/** The types of the scene events, in dispatch order. */
export function sceneEvents(explorer: IExplorer): string[]
{
    return explorer.events.filter(event => event.type.startsWith("scene-") && event.type !== "scene-content-load")
        .map(event => event.type);
}
