/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
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

import { ISystemContext } from "@ff/core/ecs/System";

////////////////////////////////////////////////////////////////////////////////

export default class UpdateContext implements ISystemContext
{
    time: Date;
    secondsElapsed: number;
    secondsDelta: number;
    frameNumber: number;

    protected _secondsStarted: number;
    protected _secondsStopped: number;

    constructor()
    {
        this.reset();
    }

    start()
    {
        if (this._secondsStopped > 0) {
            this._secondsStarted += (Date.now() * 0.001 - this._secondsStopped);
            this._secondsStopped = 0;
        }
    }

    stop()
    {
        if (this._secondsStopped === 0) {
            this._secondsStopped = Date.now() * 0.001;
        }
    }

    advance()
    {
        this.time = new Date();
        const elapsed = this.time.valueOf() * 0.001 - this._secondsStarted;
        this.secondsDelta = elapsed - this.secondsElapsed;
        this.secondsElapsed = elapsed;
        this.frameNumber++;
    }

    reset()
    {
        this.time = new Date();
        this.secondsElapsed = 0;
        this.secondsDelta = 0;
        this.frameNumber = 0;

        this._secondsStarted = Date.now() * 0.001;
        this._secondsStopped = this._secondsStarted;
    }
}