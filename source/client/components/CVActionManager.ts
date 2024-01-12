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

import Component, { types, IComponentEvent } from "@ff/graph/Component";
import { IAudio } from "client/schema/setup";
import CVMeta from "./CVMeta";
import { Dictionary } from "client/../../libs/ff-core/source/types";
import { IAudioClip } from "client/schema/meta";
import CVAssetManager from "./CVAssetManager";
import CVLanguageManager from "./CVLanguageManager";
import { TLanguageType, ELanguageType } from "client/schema/common";
import Notification from "@ff/ui/Notification";
import CustomElement, { customElement, html, property, PropertyValues } from "@ff/ui/CustomElement";
import CVAnalytics from "./CVAnalytics";

////////////////////////////////////////////////////////////////////////////////

/**
 * Component that manages scene actions.
 */
export default class CVActionManager extends Component
{
    static readonly typeName: string = "CVActionManager";

    static readonly text: string = "Actions";
    static readonly icon: string = "";

    static readonly isSystemSingleton = true;


    protected static readonly ins = {
        //playNarration: types.Event("Audio.PlayNarration"),
        //activeCaption: types.String("Audio.ActiveCaption"),
        //captionsEnabled: types.Boolean("Audio.CaptionsEnabled", true),
    };

    protected static readonly outs = {
        //narrationEnabled: types.Boolean("Audio.NarrationEnabled", false),
        //narrationPlaying: types.Boolean("Audio.NarrationPlaying", false),
        //isPlaying: types.Boolean("Audio.IsPlaying", false),
        //updated: types.Event("Audio.Updated")
    };

    ins = this.addInputs(CVActionManager.ins);
    outs = this.addOutputs(CVActionManager.outs);

    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }
    protected get language() {
        return this.getGraphComponent(CVLanguageManager, true);
    }
    protected get analytics() {
        return this.system.getMainComponent(CVAnalytics);
    }

    create()
    {
        super.create();
        //this.graph.components.on(CVMeta, this.onMetaComponent, this);

        //this.audioView = new AudioView;
        //.audioView.audio = this;

        //this.language.outs.language.on("value", this.onLanguageChange, this);
    }

    dispose()
    {

        //this.language.outs.language.off("value", this.onLanguageChange, this);
        //this.graph.components.off(CVMeta, this.onMetaComponent, this);
        super.dispose();
    }

    update()
    {
        const { ins, outs } = this;

        
        return true;
    }

    /*protected onMetaComponent(event: IComponentEvent<CVMeta>)
    {
        const meta = event.object;

        if (meta.node.typeName === "NVScene" && event.add) {
            this.audioClips = meta.audio.dictionary;  // needed to support initially empty meta nodes
            meta.once("load", () => {
                this.audioClips = meta.audio.dictionary;
                this.outs.updated.set();
                Object.keys(this.audioClips).forEach(key => {
                    this.updateAudioClip(this.audioClips[key].id);
                });
            });
        }
    }

    fromData(data: IAudio)
    {
        const { outs } = this;
        data = data || {} as IAudio;

        this._narrationId = data.narrationId || null;
        outs.narrationEnabled.setValue(this._narrationId != null);

        if(!this.audioClips[this._narrationId]) {
            outs.narrationEnabled.setValue(false);
            console.warn("Invalid narration audio ID");
        }
    }

    toData(): IAudio
    {
        let data: IAudio = null;

        if(this._narrationId !== null) {
            data = {
                narrationId: this._narrationId
            };
        }

        return data;
    }*/
}