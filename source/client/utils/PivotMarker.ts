/**
 * 3D Foundation Project
 * Copyright 2026 Smithsonian Institution
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

import {
    BufferGeometry,
    Camera,
    ColorRepresentation,
    DoubleSide,
    Float32BufferAttribute,
    Group,
    Mesh,
    MeshBasicMaterial,
    Points,
    PointsMaterial,
    RingGeometry,
    Vector3,
    Vector4,
} from "three";

import math from "@ff/core/math";
import { easingFunctions } from "@ff/core/easing";

////////////////////////////////////////////////////////////////////////////////

const _vec4 = new Vector4();
const _dir = new Vector3();
const _axis = new Vector3();

/** Smallest angle between the view direction and the ring plane, so the ring never collapses to a line. */
const _minElevation = 10 * math.DEG2RAD;

/** Size of the dot, in pixels. */
const _dotSize = 3;

/** Eases out past the target then settles back on it, overshooting by about 50%. */
const _easeOutBack = (t: number) => {
    const c = 5;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

/**
 * Transient marker showing where the orbit pivot is.
 * A dot at the pivot, like the origin of the axes helper, in a dashed ring lying flat around it.
 * Keeps a constant size on screen. When the pivot is placed, the ring pops out of the dot, slowly
 * spins, then collapses back into it after `duration`. When the pivot pans, the dot shows alone.
 */
export default class PivotMarker extends Group
{
    /** Radius of the ring, in pixels. */
    radius = 12.8;
    /** Duration of the whole effect, in milliseconds. */
    duration = 1250;
    /** Duration of the ring popping in, in milliseconds. */
    growDuration = 400;
    /** Duration of the ring collapsing at the end, in milliseconds. */
    collapseDuration = 400;
    /** Spinning speed of the ring, in degrees per second. */
    spinSpeed = 40;
    /** How long the dot stays after the pivot stops panning, in milliseconds. */
    trackDuration = 500;
    /** True until the effect is over and hidden. */
    active = false;

    protected startTime = -Infinity;
    protected trackEndTime = -Infinity;
    protected ring = new Group();
    protected ringMaterial: MeshBasicMaterial;
    protected dot: Points<BufferGeometry, PointsMaterial>;

    constructor(color: ColorRepresentation = "#00aaff")
    {
        super();

        // dashes, so the ring visibly turns when orbiting
        const dash = new RingGeometry(0.8, 1, 12, 1, 0.15, Math.PI / 2 - 0.3).rotateX(-Math.PI / 2);
        this.ringMaterial = new MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.9,
            depthTest: false,
            depthWrite: false,
            toneMapped: false,
            side: DoubleSide,
        });
        for (let i = 0; i < 4; ++i) {
            const mesh = new Mesh(dash, this.ringMaterial);
            mesh.rotation.y = i * Math.PI / 2;
            this.ring.add(mesh);
        }

        const dotGeometry = new BufferGeometry();
        dotGeometry.setAttribute("position", new Float32BufferAttribute([ 0, 0, 0 ], 3));
        this.dot = new Points(dotGeometry, new PointsMaterial({
            color,
            size: _dotSize,
            sizeAttenuation: false,
            depthTest: false,
            toneMapped: false,
        }));
        this.dot.renderOrder = 2; // over the models, which are opaque too

        this.add(this.ring, this.dot);
        this.traverse(object => object.layers.set(1)); // not pickable
        this.ring.visible = this.dot.visible = false; // the component owns the visibility of the group
    }

    /**
     * Starts the effect at the given position, in world space.
     */
    start(position: Vector3)
    {
        this.position.copy(position);
        this.startTime = performance.now();
        this.active = true;
    }

    /**
     * Shows the dot alone, following a pivot that pans, given in world space.
     * Ends a ring left from start(), which would mark the previous position.
     */
    track(position: Vector3)
    {
        this.position.copy(position);
        this.startTime = -Infinity;
        this.trackEndTime = performance.now() + this.trackDuration;
        this.active = true;
    }

    /**
     * Advances the effect. Call right before rendering with the rendering camera.
     */
    update(camera: Camera, viewportHeight: number)
    {
        const now = performance.now();
        const time = now - this.startTime;
        this.ring.visible = time < this.duration;
        this.dot.visible = this.active = this.ring.visible || now < this.trackEndTime;

        if (!this.active) {
            return;
        }

        if (this.ring.visible) {
            // ring pops out of the dot, then collapses back into it at the end
            const grow = _easeOutBack(math.limit(time / this.growDuration, 0, 1));
            const collapse = easingFunctions.EaseInCubic(math.limit((this.duration - time) / this.collapseDuration, 0, 1));
            this.ring.scale.setScalar(this.radius * Math.min(grow, collapse));
            this.ring.rotation.y = -time * 0.001 * this.spinSpeed * math.DEG2RAD;
            this.dot.material.size = _dotSize;
        }
        else {
            // dot alone shrinks away once the pivot stops panning
            this.dot.material.size = _dotSize * math.limit((this.trackEndTime - now) / 150, 0, 1);
        }

        // world units per pixel at the depth of the pivot
        const w = _vec4.set(this.position.x, this.position.y, this.position.z, 1)
            .applyMatrix4(camera.matrixWorldInverse)
            .applyMatrix4(camera.projectionMatrix).w;
        this.scale.setScalar(2 * w / (camera.projectionMatrix.elements[5] * viewportHeight));

        // lie flat, tilting toward the camera when seen edge-on
        camera.getWorldDirection(_dir);
        const elevation = Math.asin(-_dir.y);
        const tilt = Math.max(_minElevation - Math.abs(elevation), 0) * (elevation < 0 ? 1 : -1);
        this.quaternion.setFromAxisAngle(_axis.set(_dir.z, 0, -_dir.x).normalize(), tilt);

        this.updateMatrix();
        this.updateMatrixWorld(true);
    }

    dispose()
    {
        (this.ring.children[0] as Mesh).geometry.dispose();
        this.ringMaterial.dispose();
        this.dot.geometry.dispose();
        this.dot.material.dispose();
    }
}
