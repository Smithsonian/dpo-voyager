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

import { Group, MeshStandardMaterial, Mesh, Vector2, LatheGeometry } from "three";

////////////////////////////////////////////////////////////////////////////////

export default class Pin extends Group
{
    constructor()
    {
        super();

        const needlePoints = [
            0, 0,
            0.25, 0.4,
            0.4, 10,
        ];

        const handlePoints = [
            0, 10,
            3.4, 10,
            3.5, 10.1,
            3.5, 11,
            3.45, 11.1,
            2.05, 12.5,
            2, 12.6,
            2, 17.4,
            2.05, 17.5,
            3.45, 18.9,
            3.5, 19,
            3.5, 19.9,
            3.4, 20,
            0, 20,
        ];

        const needleMaterial = new MeshStandardMaterial({ color: "white", metalness: 1 });
        needleMaterial.transparent = true;

        const needle = new Mesh(
            this.createLatheGeometry(needlePoints),
            needleMaterial
        );

        const handleMaterial = new MeshStandardMaterial(({ color: "#ffcd00", roughness: 0.8, metalness: 0.1 }));
        handleMaterial.transparent = true;

        const handle = new Mesh(
            this.createLatheGeometry(handlePoints),
            handleMaterial
        );

        needle.matrixAutoUpdate = false;
        this.add(needle);

        handle.matrixAutoUpdate = false;
        this.add(handle);
    }

    dispose()
    {

    }

    protected createLatheGeometry(points: number[])
    {
        const vectors = [];

        for (let i = 0, n = points.length; i < n; i += 2) {
            vectors.push(new Vector2(points[i], points[i + 1]));
        }

        return new LatheGeometry(vectors, 16);
    }
}
