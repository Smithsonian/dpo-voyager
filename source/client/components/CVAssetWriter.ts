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

import Component, { Node } from "@ff/graph/Component";

import { INodeComponents } from "../nodes/NVNode";

import CVDocument from "./CVDocument";
import CVAssetManager from "./CVAssetManager";
import CVStandaloneFileManager from "./CVStandaloneFileManager"

import { assetRevisions } from "../io/AssetRevisions";


////////////////////////////////////////////////////////////////////////////////

/**
 * Thrown when a server refuses a conditional write because the asset changed since we read it —
 * `409 Conflict` or `412 Precondition Failed`. Nothing was written.
 */
export class WriteConflictError extends Error
{
    constructor(readonly response: Response, message: string)
    {
        super(message);
        this.name = "WriteConflictError";
    }
}

export default class CVAssetWriter extends Component
{
    static readonly typeName: string = "CVAssetWriter";

    static readonly text: string = "AssetWriter";
    static readonly icon: string = "";

    static readonly isSystemSingleton = true;



    constructor(node: Node, id: string)
    {
        super(node, id);

        const loadingManager = this.assetManager.loadingManager;

    }

    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }
    protected get standaloneFileManager() {
        return this.getGraphComponent(CVStandaloneFileManager, true);
    }


    /**
     * Writes an asset and returns the response.
     * @throws {WriteConflictError} if the server refused a conditional write.
     */
    async put(body: string|BlobPart, contentType :string, assetPath: string): Promise<Response>
    {

        const standaloneManager = this.standaloneFileManager;
        if(standaloneManager) {
            standaloneManager.addFile(assetPath, [body]);
            return new Response(null, { status: 204 });
        }

        const url = this.assetManager.getAssetUrl(assetPath);
        const headers :Record<string, string> = {
            "Accept": "text/plain",
            "Content-Type": contentType,
        };

        const etag = assetRevisions.get(url);
        if (etag) {
            headers["If-Match"] = etag;
        }

        const res = await fetch(url, {
            method: "PUT",
            headers,
            body,
        });

        // WebDAV answers 409 to an unconditional PUT with a missing parent collection, which is
        // a different problem: only a conditional write can be refused for being out of date.
        if (etag && (res.status === 409 || res.status === 412)) {
            throw new WriteConflictError(res,
                `'${assetPath}' was modified since it was read, and nothing was written`);
        }

        if(!res.ok) {
            const txt = await res.text();
            throw new Error(`Failed to PUT ${contentType} to ${url}: ${txt ?? res.statusText}`);
        }

        // On 205 the entity-tag names content we do not have, so it must not be adopted here:
        // the caller either reloads, picking up the new tag with it, or keeps the one we hold.
        if (res.status !== 205) {
            assetRevisions.update(url, res);
        }

        return res;
    }

    async putJSON(json: any, assetPath: string): Promise<Response>
    {
        if (typeof json !== "string") {
            json = JSON.stringify(json);
        }
        return await this.put(json, "application/json", assetPath);
    }

    async putText(text: string, assetPath: string): Promise<Response>
    {
        return await this.put(text, "text/plain", assetPath);
    }

    putDocument(document: CVDocument, components?: INodeComponents, assetPath?: string): Promise<Response>
    {
        const documentData = document.deflateDocument(components);

        return this.putJSON(documentData, assetPath || document.outs.assetPath.value);
    }

    /** Forgets which revision of an asset we hold, so that the next write to it is unconditional. */
    forgetRevision(assetPath: string)
    {
        assetRevisions.forget(this.assetManager.getAssetUrl(assetPath));
    }

}