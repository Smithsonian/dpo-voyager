/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import { LoadingManager, BufferGeometry } from "three";

import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import {PLYLoader} from "three/examples/jsm/loaders/PLYLoader";

////////////////////////////////////////////////////////////////////////////////

export default class GeometryReader
{
    static readonly extensions = [ "obj", "ply" ];

    protected objLoader: any;
    protected plyLoader: any;

    constructor(loadingManager: LoadingManager)
    {
        this.objLoader = new OBJLoader(loadingManager);
        this.plyLoader = new PLYLoader(loadingManager);
    }

    isValid(url: string): boolean
    {
        const extension = url.split(".").pop().toLowerCase();
        return GeometryReader.extensions.indexOf(extension) >= 0;
    }

    get(url: string): Promise<BufferGeometry>
    {
        const extension = url.split(".").pop().toLowerCase();

        return new Promise((resolve, reject) => {
            if (extension === "obj") {
                this.objLoader.load(url, result => {
                    const geometry = result.children[0].geometry;
                    if (geometry && geometry.type === "Geometry" || geometry.type === "BufferGeometry") {
                        return resolve(geometry);
                    }

                    return reject(new Error(`Can't parse geometry from '${url}'`));
                });
            }
            else if (extension === "ply") {
                this.plyLoader.load(url, geometry => {
                    if (geometry && geometry.type === "Geometry" || geometry.type === "BufferGeometry") {
                        return resolve(geometry);
                    }

                    return reject(new Error(`Can't parse geometry from '${url}'`));
                });
            }
            else {
                throw new Error(`Can't load geometry, unknown extension: '${extension}' in '${url}'`);
            }
        });
    }
}