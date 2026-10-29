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

import fetchOk from "../utils/fetchOk";

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
     * Get parsed JSON. Fails as [[fetchOk]] does.
     */
    async getJSON(url: string, {signal}:{signal?:AbortSignal}={}): Promise<any>
    {
        this._loadingManager.itemStart(url);

        try {
            const result = await fetchOk(url, {
                headers: {
                    "Accept": "application/json"
                },
                signal,
            });

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
     * Fails as [[fetchOk]] does.
     */
    async getText(url: string, {signal}:{signal?:AbortSignal}={}): Promise<any>
    {
        //this._loadingManager.itemStart(url);

        return fetchOk(url, {
            headers: {
                "Accept": url.endsWith(".html")?"text/html":"text/plain"
            },
            signal,
        }).then(result => {
            //this._loadingManager.itemEnd(url);
            return result.text();
        });
    }
}