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

import { EMarkerStyle, TMarkerStyle } from "client/schema/setup";
import {
    Group,
    Mesh,
    Material,
    MeshStandardMaterial,
    SphereGeometry,
    TorusGeometry,
    Vector2,
    LatheGeometry
} from "three";

////////////////////////////////////////////////////////////////////////////////

/*export type TMarkerStyle = "Sphere" | "Ring" | "Crosshair" | "Disc" | "Pin";
export enum EMarkerStyle { Sphere, Ring, Crosshair, Disc, Pin }

const markerStyleValues: TMarkerStyle[] = ["Sphere", "Ring", "Crosshair", "Disc", "Pin"];
*/
export function getMarkerStyleValue(index: number): TMarkerStyle {
    return EMarkerStyle[index] as TMarkerStyle || "Pin";
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Abstract base class for measurement markers.
 * Alternatives to default pin-style.
 */
export abstract class MeasurementMarker extends Group
{
    abstract dispose(): void;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Ring/Torus marker - a flat ring that sits on the surface.
 * Indicates measurement point without suggesting penetration.
 */
export class RingMarker extends MeasurementMarker
{
    protected ring: Mesh;
    protected centerDot: Mesh;

    constructor()
    {
        super();

        // Torus ring
        const torusGeometry = new TorusGeometry(5, 0.8, 8, 32);
        const torusMaterial = new MeshStandardMaterial({
            color: "#00aaff",
            metalness: 0.5,
            roughness: 0.3,
            transparent: true,
            opacity: 0.85
        });

        this.ring = new Mesh(torusGeometry, torusMaterial);
        this.ring.matrixAutoUpdate = false;
        // Rotate to lie flat (ring lies in XZ plane, perpendicular to Y)
        this.ring.rotation.x = Math.PI / 2;
        this.ring.position.set(0, 1, 0);
        this.ring.updateMatrix();

        // Center dot for precise point indication
        const dotGeometry = new SphereGeometry(1.2, 8, 8);
        const dotMaterial = new MeshStandardMaterial({
            color: "#ffffff",
            metalness: 0.3,
            roughness: 0.4,
            transparent: true,
            opacity: 0.9
        });

        this.centerDot = new Mesh(dotGeometry, dotMaterial);
        this.centerDot.matrixAutoUpdate = false;
        this.centerDot.position.set(0, 1.5, 0);
        this.centerDot.updateMatrix();

        this.add(this.ring);
        this.add(this.centerDot);
    }

    dispose()
    {
        this.remove(this.ring, this.centerDot);

        (this.ring.material as Material).dispose();
        (this.centerDot.material as Material).dispose();
        this.ring.geometry.dispose();
        this.centerDot.geometry.dispose();
    }
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Pin marker - classic push-pin style (original Voyager style).
 * Kept for backward compatibility and user preference.
 */
export class PinMarker extends MeasurementMarker
{
    protected needle: Mesh;
    protected handle: Mesh;

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

        this.needle = new Mesh(
            this.createLatheGeometry(needlePoints),
            needleMaterial
        );

        const handleMaterial = new MeshStandardMaterial({ color: "#ffcd00", roughness: 0.8, metalness: 0.1 });
        handleMaterial.transparent = true;

        this.handle = new Mesh(
            this.createLatheGeometry(handlePoints),
            handleMaterial
        );

        this.needle.matrixAutoUpdate = false;
        this.add(this.needle);

        this.handle.matrixAutoUpdate = false;
        this.add(this.handle);
    }

    dispose()
    {
        this.remove(this.handle, this.needle);

        (this.needle.material as Material).dispose();
        (this.handle.material as Material).dispose();
        this.needle.geometry.dispose();
        this.handle.geometry.dispose();
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

////////////////////////////////////////////////////////////////////////////////

/**
 * Factory function to create a marker of the specified style.
 */
export function createMarker(style: TMarkerStyle | EMarkerStyle): MeasurementMarker
{
    const styleValue = typeof style === "number" ? getMarkerStyleValue(style) : style;

    switch (styleValue) {
        case "Ring":
            return new RingMarker();
        case "Pin":
            return new PinMarker();
    }
}