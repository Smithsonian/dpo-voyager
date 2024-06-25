/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { VideoTexture } from "three";

import CTexture, { types } from "./CTexture";

////////////////////////////////////////////////////////////////////////////////

export default class CVideoTexture extends CTexture
{
    static readonly typeName: string = "CVideoTexture";

    private static readonly ins = {
        videoPath: types.String("Video.Path"),
        videoPlay: types.Event("Video.Play"),
        videoPause: types.Event("Video.Pause"),
        videoLoop: types.Boolean("Video.Loop", true),
        videoAutoPlay: types.Boolean("Video.AutoPlay", true),
    };

    private static readonly outs = {
        isPlaying: types.Boolean("Video.IsPlaying"),
    };

    ins = this.addInputs<CTexture, typeof CVideoTexture.ins>(CVideoTexture.ins, 0);
    outs = this.addOutputs<CTexture, typeof CVideoTexture.outs>(CVideoTexture.outs, 0);

    protected _video: HTMLVideoElement = null;

    create()
    {
        const ins = this.ins;
        const outs = this.outs;

        ins.mipmaps.setValue(false);

        const video = this._video = document.createElement("video") as HTMLVideoElement;

        video.oncanplaythrough = () => {
            outs.width.setValue(video.videoWidth);
            outs.height.setValue(video.videoHeight);
            outs.isReady.setValue(true);
            outs.self.set();

            if (ins.videoAutoPlay.value) {
                video.play();
            }
        };

        video.onplay = () => {
            outs.isPlaying.setValue(true);
        };
        video.onpause = () => {
            outs.isPlaying.setValue(false);
        };
        video.onended = () => {
            if (ins.videoLoop.value) {
                video.play();
            }
        };

        video.onerror = () => {
            outs.width.setValue(0);
            outs.height.setValue(0);
            outs.isPlaying.setValue(false);
            outs.isReady.setValue(false);
            outs.self.set();
        };

        this._texture = new VideoTexture(this._video);

        super.create();
    }

    update(context)
    {
        super.update(context);

        const ins = this.ins;
        const outs = this.outs;

        if (ins.videoPath.changed) {
            const path = ins.videoPath.value;
            if (path) {
                this._video.src = ins.videoPath.value;
            }
            else {
                this._video.src = "";
                outs.isReady.setValue(false);
                outs.self.set();
            }
        }

        if (ins.videoPlay.changed) {
            this._video.play();
        }
        if (ins.videoPause.changed) {
            this._video.pause();
        }

        return true;
    }

    dispose()
    {
        this._video.src = "";
        this._video = null;
        this._texture.image = undefined;
        super.dispose();
    }
}