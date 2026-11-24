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

import { TDerivativeQuality } from "client/schema/model";

////////////////////////////////////////////////////////////////////////////////

/** A model of the scene, that an import may go to */
export interface IImportTarget
{
    /** The model component's id: what the import's result names it by */
    id: string;
    /** The model's node's name */
    name: string;
    /** Qualities of the model's Web3D derivatives: a model imported to it replaces those of the same quality */
    qualities: TDerivativeQuality[];
}

export interface IImportedDerivative
{
    quality: TDerivativeQuality;
    /** The derivative's model, relative to the scene's root */
    uri: string;
}

/**
 * What to do with imported files, once they are in the scene: what an import menu resolves with, Voyager's or the host's.
 * Every `uri` is relative to the scene's root.
 * - `model`: add derivatives to a new model named `name`, or to an existing one (`target`), replacing its derivatives of the same quality.
 *   They're listed from the lowest quality to the highest: the last one shows.
 * - `environment`: an image for the environment map
 * - `overlay`: an image for an overlay map of an existing model
 * - `plane`: an image for a new image plane
 * - `null`: nothing more to do, the files are for the scene to use later (articles' images, audio, captions...)
 */
export type IFileImportResult =
    | { kind: "model", target: string | null, name: string, derivatives: IImportedDerivative[] }
    | { kind: "environment", uri: string }
    | { kind: "overlay", target: string, uri: string }
    | { kind: "plane", uri: string }
    | null;

export interface IImportFilesEventDetail
{
    /**
     * The dropped files, by path among them, with "/" separators. Example: "scan/model.obj", "scan/tex/diffuse.jpg".
     * Empty when the import is opened from the Navigator's "Import" button.
     */
    files: Map<string, File>;
    /** The scene's models, that the import may go to */
    models: IImportTarget[];
    /**
     * Take the import over: Voyager imports none of the files, and does what the promise resolves with once they're in the scene.
     * The promise rejects when the import is abandoned: with nothing or an "AbortError" when it's cancelled, quietly,
     * with an Error otherwise, which Voyager only logs. The host tells its user about it.
     * Must be called while the event is dispatched. It prevents the event's default.
     */
    respondWith(result: Promise<IFileImportResult>): void;
}

/**
 * Dispatched on `<voyager-story>` when files are to be imported into the scene: dropped files (but a drop that has a scene document),
 * or none from the Navigator's "Import" button. It bubbles, and is cancelable.
 *
 * The host may take the import over with `event.detail.respondWith()`, in place of Voyager's import menus:
 * show its own menu, convert and optimize models on its server, choose where files are stored...
 * Otherwise, Voyager writes dropped files as-is to the scene and asks what they're for in its own menus,
 * or opens a file picker from the "Import" button.
 *
 * @example
 * story.addEventListener("import-files", (e: ImportFilesEvent) => {
 *     e.detail.respondWith(showMyMenu(e.detail.files, e.detail.models));
 * });
 */
export type ImportFilesEvent = CustomEvent<IImportFilesEventDetail>;

export const IMPORT_FILES_EVENT = "import-files";

/**
 * Dispatch an {@link ImportFilesEvent} on `target`
 * @returns the host's result, or null when no listener took the import over
 */
export function dispatchImportFiles(target: EventTarget, files: Map<string, File>, models: IImportTarget[]): Promise<IFileImportResult> | null
{
    let result: Promise<IFileImportResult> = null;
    const event: ImportFilesEvent = new CustomEvent(IMPORT_FILES_EVENT, {
        bubbles: true,
        cancelable: true,
        detail: {
            files,
            models,
            respondWith(promise) {
                if (result) {
                    throw new Error("The import was already taken over");
                }
                result = Promise.resolve(promise);
                event.preventDefault();
            },
        },
    });
    target.dispatchEvent(event);
    return result;
}
