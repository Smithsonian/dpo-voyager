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

////////////////////////////////////////////////////////////////////////////////

/**
 * Remembers which revision of an asset this session last saw, as the entity-tag the server
 * gave for it, so a write can quote it back in `If-Match`.
 */
export class AssetRevisions
{
    private _tags: Record<string, string> = {};

    /** Records the revision a response reports for `url`, clearing it if there is none. */
    update(url: string, response: Response)
    {
        const etag = response.headers.get("ETag");

        // Only a strong validator may be used with If-Match (RFC 9110 §13.1.1).
        if (etag && !etag.startsWith("W/")) {
            this._tags[url] = etag;
        }
        else {
            delete this._tags[url];
        }
    }

    /** The revision `url` was last seen at, or undefined if we can't say. */
    get(url: string): string | undefined
    {
        return this._tags[url];
    }

    /** Forgets `url`, so that the next write to it is unconditional. */
    forget(url: string)
    {
        delete this._tags[url];
    }
}

/** The store shared by every reader and writer in the page, keyed by absolute URL. */
export const assetRevisions = new AssetRevisions();
