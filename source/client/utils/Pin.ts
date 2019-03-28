/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

////////////////////////////////////////////////////////////////////////////////

export default class Pin extends THREE.Group
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

        const needleMaterial = new THREE.MeshStandardMaterial({ color: "white", metalness: 1 });
        needleMaterial.transparent = true;

        const needle = new THREE.Mesh(
            this.createLatheGeometry(needlePoints),
            needleMaterial
        );

        const handleMaterial = new THREE.MeshStandardMaterial(({ color: "#ffcd00", roughness: 0.8, metalness: 0.1 }));
        handleMaterial.transparent = true;

        const handle = new THREE.Mesh(
            this.createLatheGeometry(handlePoints),
            handleMaterial
        );

        needle.matrixAutoUpdate = false;
        this.add(needle);

        handle.matrixAutoUpdate = false;
        this.add(handle);

        this.matrixAutoUpdate = false;
        this.scale.setScalar(0.1);
        this.updateMatrix();
    }

    dispose()
    {

    }

    protected createLatheGeometry(points: number[])
    {
        const vectors = [];

        for (let i = 0, n = points.length; i < n; i += 2) {
            vectors.push(new THREE.Vector2(points[i], points[i + 1]));
        }

        return new THREE.LatheBufferGeometry(vectors, 16);
    }
}
