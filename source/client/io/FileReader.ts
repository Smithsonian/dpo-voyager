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

import { LoadingManager } from "three";

import { assetRevisions } from "./AssetRevisions";

////////////////////////////////////////////////////////////////////////////////
/**
 * Most generic loader, for files that require little to no processing.
 * In particular text/html/json files.
 */
export default class FileReader
{
    private _loadingManager: LoadingManager;

    constructor(loadingManager: LoadingManager)
    {
        this._loadingManager = loadingManager;
    }

    /**
     * Fetches a file and hands back the whole response, for callers that need more than the
     * body. Throws on any status other than 2xx.
     *
     * Reading a file is also how we learn which revision of it we hold, so the response's
     * entity-tag is recorded here for anyone who later writes the same URL back.
     */
    async getResponse(url: string, accept: string): Promise<Response>
    {
        const result = await fetch(url, {
            headers: {
                "Accept": accept
            }
        });

        if (!result.ok) {
            throw new Error(`failed to fetch from '${url}', status: ${result.status} ${result.statusText}`);
        }

        assetRevisions.update(url, result);
        return result;
    }

    async getJSON(url: string): Promise<any>
    {
        this._loadingManager.itemStart(url);

        try {
            const result = await this.getResponse(url, "application/json");
            return await result.json();
        }
        catch (error) {
            this._loadingManager.itemError(url);
            throw error;
        }
        finally {
            this._loadingManager.itemEnd(url);
        }
    }

    /**
     * Get text. Will prefer text/html over text/plain if url ends with .html.
     */
    async getText(url: string): Promise<any>
    {
        const result = await this.getResponse(url, url.endsWith(".html") ? "text/html" : "text/plain");
        return result.text();
    }
}