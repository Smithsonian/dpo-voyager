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

// Adapted from https://github.com/JulieWinchester/iiif-threejs-demo/blob/main/src/iiif.js

import * as manifesto from "@iiif/3d-manifesto-dev/dist-esmodule";
import { Manifest, Scene } from "@iiif/3d-manifesto-dev/dist-esmodule/";

////////////////////////////////////////////////////////////////////////////////

export default class IIIFManifest {

    manifestJson: string = null;
    manifestUrl: string = null;
    manifest: Manifest = null;
    scenes: Scene[] = null;

    constructor(manifest) {
      // Is manifest JSON or URL?
      if (isJsonString(manifest)) {
        this.manifestJson = manifest;
        this.manifestUrl = null;
        this.manifest = manifesto.parseManifest(manifest) as Manifest;
      } else {
        this.manifestJson = null;
        this.manifestUrl = manifest;
      }
    }

    async loadManifest() {
      if (this.manifestUrl)
        this.manifestJson = await manifesto.loadManifest(this.manifestUrl);

      if (this.manifestJson)
        this.manifest = await manifesto.parseManifest(this.manifestJson) as Manifest;

      if (this.manifest)
        this.scenes = this.manifest?.getSequences()[0]?.getScenes() || [];
    }

    annotationsFromScene(scene: Scene) {
      return scene?.getContent().concat(scene?.getNonContentAnnotations()) || [];
    }
  }

  function isJsonString(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }