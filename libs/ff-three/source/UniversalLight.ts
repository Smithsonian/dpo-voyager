/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
    Object3D,
    Light,
    LightShadow,
    DirectionalLightShadow,
    SpotLightShadow,
    PerspectiveCamera,
} from "three";

import uniqueId from "@ff/core/uniqueId";

////////////////////////////////////////////////////////////////////////////////

export enum ELightType { Directional, Point, Spot }

export default class UniversalLight extends Light
{
    type: string;
    isDirectionalLight: boolean;
    isPointLight: boolean;
    isSpotLight: boolean;
    isLight: true;

    // directional light parameters
    target: THREE.Object3D = null;

    // point light parameters
    distance: number = 0;
    decay: number = 1;

    // spot light parameters
    angle: number = Math.PI / 3;
    penumbra: number = 0;

    shadow: THREE.LightShadow = null;


    constructor(type?: ELightType, color?: number | string, intensity?: number)
    {
        super(color, intensity);
        this.setType(type);
    }

    setType(type: ELightType)
    {
        if (type === this.getType()) {
            return;
        }

        if (type === ELightType.Point) {
            this.type = "PointLight";
            this.isDirectionalLight = false;
            this.isPointLight = true;
            this.isSpotLight = false;

            this.shadow = new LightShadow(new PerspectiveCamera(90, 1, 0.5, 500));
        }
        else if (type === ELightType.Spot) {
            this.type = "SpotLight";
            this.isDirectionalLight = false;
            this.isPointLight = false;
            this.isSpotLight = true;

            this.position.copy(Object3D.DefaultUp);
            this.updateMatrix();
            this.target = new Object3D();

            this.shadow = new SpotLightShadow(undefined);
        }
        else {
            this.type = "DirectionalLight";
            this.isDirectionalLight = true;
            this.isPointLight = false;
            this.isSpotLight = false;

            this.position.copy(Object3D.DefaultUp);
            this.updateMatrix();
            this.target = new Object3D();

            this.shadow = new DirectionalLightShadow(undefined);
        }
    }

    getType(): ELightType
    {
        return this.isPointLight ? ELightType.Point : (this.isSpotLight ? ELightType.Spot : ELightType.Directional);
    }

    get power() {
        return this.isSpotLight ? this.intensity * Math.PI : this.intensity * 4 * Math.PI;
    }
    set power(value: number) {
        this.intensity = this.isSpotLight ? value / Math.PI : value / (4 * Math.PI);
    }

    copy(source: this)
    {
        super.copy(source);

        this.target = source.target.clone();
        this.distance = source.distance;
        this.decay = source.decay;
        this.angle = source.angle;
        this.penumbra = source.penumbra;

        this.shadow = source.shadow.clone();

        return this;
    }

    clone(): this
    {
        return new (this.constructor as any)().copy(this);
    }

    toJSON(meta)
    {
        return super.toJSON(meta);
    }
}