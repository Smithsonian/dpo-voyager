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

import type { BufferGeometry, Material, Mesh, Source, Texture } from "three";

import Derivative, { EAssetType } from "../models/Derivative";

////////////////////////////////////////////////////////////////////////////////

export interface TextureStats
{
    width: number;
    height: number;
    /**
     * "ktx2" when the transcoded texture can't tell ETC1S from UASTC (see KTX2Loader's FORMAT_OPTIONS).
     * Unknown mime types are reported as their subtype.
     */
    format: "png"|"jpg"|"webp"|"ktx2"|"ktx2/etc1s"|"ktx2/uastc"|string;
    /** Material properties using this image: map, normalMap, roughnessMap... */
    slots: string[];
}

export interface AssetStats
{
    /** What the scene document says about the model asset */
    declared: {
        byteSize: number;
        numFaces: number;
        imageSize: number;
    };
    /** Measured on the loaded object: absent while the derivative isn't loaded */
    measured?: {
        vertexCount: number;
        faceCount: number;
        textures: TextureStats[];
    };
}

const textureFormats: Record<string, TextureStats["format"]> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/ktx2": "ktx2",
};

/** Material properties holding a texture that isn't the asset's own */
const ignoredSlots = new Set(["envMap"]);

/**
 * Report a derivative's content. Approximate: meant to inform, not to be authoritative.
 * Counts the asset's content rather than what is drawn: a geometry used by several meshes (or instanced) counts once.
 */
export function getAssetStats(derivative: Derivative): AssetStats
{
    const asset = derivative.findAsset(EAssetType.Model);
    const stats: AssetStats = {
        declared: {
            byteSize: asset?.data.byteSize ?? 0,
            numFaces: asset?.data.numFaces ?? 0,
            imageSize: asset?.data.imageSize ?? 0,
        },
    };
    if (!derivative.model) return stats;

    let vertexCount = 0, faceCount = 0;
    const geometries = new Set<BufferGeometry>();
    // Keyed by image: textures are cloned for KHR_texture_transform or a different texCoord,
    // and one image often fills several slots (occlusion/roughness/metalness)
    const textures = new Map<Source<unknown>, TextureStats>();

    derivative.model.traverse((object) => {
        const geometry: BufferGeometry|undefined = (object as Mesh).geometry;
        if (geometry && !geometries.has(geometry)) {
            geometries.add(geometry);
            const vertices = geometry.attributes.position?.count ?? 0;
            vertexCount += vertices;
            if ((object as Mesh).isMesh) {
                faceCount += Math.floor((geometry.index?.count ?? vertices) / 3);
            }
        }

        // A selected KHR_materials_variants variant replaces the asset's default material
        const material = object.userData.originalMaterial ?? (object as Mesh).material;
        const materials: Material[] = !material ? [] : Array.isArray(material) ? material : [material];
        for (const material of materials) {
            // Shader modes (Clay, Wireframe) take textures out of their slots and keep them here
            const saved = material.userData.paramCopy ?? {};
            for (const slot of new Set([...Object.keys(material), ...Object.keys(saved)])) {
                if (ignoredSlots.has(slot)) continue;
                const texture: Texture<{width?: number, height?: number}> = slot in saved ? saved[slot] : material[slot];
                if (!texture?.isTexture) continue;

                let entry = textures.get(texture.source);
                if (!entry) {
                    const mimeType: string = texture.userData.mimeType ?? "";
                    entry = {
                        width: texture.image?.width ?? 0,
                        height: texture.image?.height ?? 0,
                        format: textureFormats[mimeType] ?? (mimeType.split("/").pop() || "unknown"),
                        slots: [],
                    };
                    textures.set(texture.source, entry);
                }
                if (!entry.slots.includes(slot)) entry.slots.push(slot);
            }
        }
    });

    stats.measured = { vertexCount, faceCount, textures: [...textures.values()] };
    return stats;
}

////////////////////////////////////////////////////////////////////////////////

const prefixes = ["", "k", "M", "G", "T", "P", "E"];

/**
 * Shorten a number to 3 significant digits with an SI prefix (k, M, G...): 1234 gives "1.23k".
 * With a unit it is spaced out from the number: "2.34 MB". Without, the prefix sticks to the number so callers can append a word.
 */
export function formatNumber(value: number, { unit = "" }: { unit?: string } = {}): string
{
    if (!Number.isFinite(value)) return String(value);
    const exponent = Math.min(prefixes.length - 1, Math.max(0, Math.floor(Math.log10(Math.abs(value)) / 3)));
    const number = Number((value / 1000 ** exponent).toPrecision(3)).toLocaleString(undefined, { maximumFractionDigits: 20 });
    return unit ? `${number} ${prefixes[exponent]}${unit}` : number + prefixes[exponent];
}
