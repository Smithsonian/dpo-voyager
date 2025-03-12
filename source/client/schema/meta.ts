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

import { Index, Dictionary } from "@ff/core/types";

////////////////////////////////////////////////////////////////////////////////

/**
 * Contains meta data (articles, collection record, processing information)
 * about a scene item (scene root, model).
 */
export interface IMeta
{
    collection?: Dictionary<any>;
    process?: Dictionary<any>;
    images?: IImage[];
    articles?: IArticle[];
    audio?: IAudioClip[];
    actions?: IAction[];
    leadArticle?: Index;
}

export interface IImage
{
    quality: TImageQuality,
    uri: string;
    byteSize: number;
    width: number;
    height: number;
    usage?: TImageUsage;
}

export type TImageQuality = "Thumb" | "Low" | "Medium" | "High";
export type TImageUsage = "Render" | "ARCode";

/**
 * Refers to an external document or a media file (audio, video, image).
 */
export interface IArticle
{
    id: string;
    uri: string;
    uris?: Dictionary<string>;

    title?: string;
    titles?: Dictionary<string>;
    lead?: string;
    leads?: Dictionary<string>;
    tags?: string[];
    taglist?: Dictionary<string[]>;
    intros?: Dictionary<string[]>;

    mimeType?: string;
    thumbnailUri?: string;
}

/**
 * Notes taken during processing. Part of the process section of [[IMeta]].
 */
export interface INote
{
    date: string;
    user: string;
    text: string;
}

/**
 * Audio files referenced by the scene [narrations, audio descriptions, etc.].
 */
export interface IAudioClip
{
    id: string;
    name: string;
    uris: Dictionary<string>;
    captionUris: Dictionary<string>;
    durations: Dictionary<string>;
}

/**
 * Triggered actions (animation, audio, etc. on click, proximity, etc.)
 */
 export interface IAction
 {
     id: string;
     type: TActionType;
     trigger: TActionTrigger;
     audioId: string;
     animation: string;
     style: TActionPlayStyle;
 }

 export type TActionType = "PlayAnimation" | "PlayAudio";
 export enum EActionType { PlayAnimation, PlayAudio };

 export type TActionTrigger = "OnClick";
 export enum EActionTrigger { OnClick };

 export type TActionPlayStyle = "Single" | "PingPong";
 export enum EActionPlayStyle { Single, PingPong };
