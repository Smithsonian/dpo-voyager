/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Component, { types, IUpdateContext, ITypedEvent, Node } from "../Component";

////////////////////////////////////////////////////////////////////////////////

/**
 * Information about pulse timing, including absolute system time, elapsed time
 * since the pulse was started, delta time since last pulse, and pulse (frame) number.
 */
export interface IPulseContext extends IUpdateContext
{
    time: Date;
    secondsElapsed: number;
    secondsDelta: number;
    frameNumber: number;
}

/**
 * Emitted by [[CPulse]] when an animation frame event occurs.
 * @event
 */
export interface IPulseEvent extends ITypedEvent<"pulse">
{
    /** Information about pulse timing. */
    context: IPulseContext;
    systemUpdated: boolean;
}

/**
 * Generates a steady stream of events based on `window.requestAnimationFrame`.
 */
export default class CPulse extends Component
{
    static readonly typeName: string = "CPulse";
    static readonly isSystemSingleton: boolean = true;

    protected static readonly pulseOuts = {
        time: types.Number("Pulse.Time"),
        frame: types.Integer("Pulse.Frame")
    };

    outs = this.addOutputs(CPulse.pulseOuts);

    readonly context: IPulseContext;

    private _secondsStarted: number;
    private _secondsStopped: number;
    private _animHandler: number;
    private _pulseEvent: IPulseEvent;
    private _tockUpdated = false;

    constructor(node: Node, id: string)
    {
        super(node, id);
        this.addEvent("pulse");

        this.onAnimationFrame = this.onAnimationFrame.bind(this);

        this.context = {
            time: new Date(),
            secondsElapsed: 0,
            secondsDelta: 0,
            frameNumber: 0
        };

        this._secondsStarted = Date.now() * 0.001;
        this._secondsStopped = this._secondsStarted;
        this._animHandler = 0;
        this._pulseEvent = { type: "pulse", context: this.context, systemUpdated: false };
    }

    start()
    {
        if (this._animHandler === 0) {

            if (this._secondsStopped > 0) {
                this._secondsStarted += (Date.now() * 0.001 - this._secondsStopped);
                this._secondsStopped = 0;
            }

            this._animHandler = window.requestAnimationFrame(this.onAnimationFrame);
        }
    }

    stop()
    {
        if (this._animHandler !== 0) {
            if (this._secondsStopped === 0) {
                this._secondsStopped = Date.now() * 0.001;
            }
            window.cancelAnimationFrame(this._animHandler);
            this._animHandler = 0;
        }
    }

    pulse(milliseconds: number)
    {
        const {
            outs,
            context,
            _pulseEvent
        } = this;

        // update context
        context.time.setTime(milliseconds);
        const elapsed = milliseconds * 0.001 - this._secondsStarted;
        context.secondsDelta = elapsed - context.secondsElapsed;
        context.secondsElapsed = elapsed;
        context.frameNumber++;

        outs.time.setValue(context.secondsElapsed);
        outs.frame.setValue(context.frameNumber);

        // execute tick
        const tickUpdated = this.system.graph.tick(context);

        // emit pulse event
        _pulseEvent.systemUpdated = tickUpdated || this._tockUpdated;
        this.emit<IPulseEvent>(_pulseEvent);

        // execute tock
        this._tockUpdated = this.system.graph.tock(context);
    }

    protected onAnimationFrame()
    {
        this.pulse(Date.now());
        this._animHandler = window.requestAnimationFrame(this.onAnimationFrame);
    }
}