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

import { HTTPError } from "./errors";

////////////////////////////////////////////////////////////////////////////////

/**
 * fetch(), resolving only with successful responses. Rejects with:
 * - an [[HTTPError]] if the server answers with an error status. Its detail is the server's explanation
 *   if it gave one in plain text, the status text otherwise.
 * - a "NetworkError" DOMException if no answer arrives: the server is unreachable or the connection was lost.
 * - the signal's reason if it aborts first, as fetch() does.
 */
export default async function fetchOk(url: string, init: RequestInit = {}): Promise<Response>
{
    let response: Response;
    try {
        response = await fetch(url, init);
    }
    catch (e) {
        if (init.signal?.aborted) {
            throw e;
        }
        throw new DOMException(`Failed to reach ${url}: ${e?.message ?? e}`, "NetworkError");
    }

    if (!response.ok) {
        // The status is the answer; the explanation is a bonus that may fail to arrive.
        const isText = response.headers.get("Content-Type")?.startsWith("text/plain");
        const txt = isText ? await response.text().catch(() => "") : "";
        throw new HTTPError(url, response.status, txt || response.statusText);
    }

    return response;
}
