/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Light } from "three";

import { ITypedEvent, Node, types } from "@ff/graph/Component";
import CObject3D from "./CObject3D";
import { INodeChangeEvent } from "@ff/graph/Node";

////////////////////////////////////////////////////////////////////////////////

export enum EShadowMapResolution { Low, Medium, High }

export interface ITagUpdateEvent extends ITypedEvent<"tag-update">
{
}

const _mapResolution = {
    [EShadowMapResolution.Low]: 512,
    [EShadowMapResolution.Medium]: 1024,
    [EShadowMapResolution.High]: 2048,
};

export default class CLight extends CObject3D
{
    static readonly typeName: string = "CLight";
    canDelete: boolean = true;

    protected static readonly lightIns = {
        name: types.String("Light.Name"), 
        enabled: types.Boolean("Light.Enabled", true),
        color: types.ColorRGB("Light.Color"),
        intensity: types.Number("Light.Intensity", {
            preset:1,
            min: 0,
        }),
        tags: types.String("Light.Tags"),
        activeTags: types.String("Light.ActiveTags"),
        shadowEnabled: types.Boolean("Shadow.Enabled"),
        shadowResolution: types.Enum("Shadow.Resolution", EShadowMapResolution, EShadowMapResolution.Medium),
        shadowBlur: types.Number("Shadow.Blur", 1),
        shadowIntensity: types.Number("Shadow.Intensity", {
            preset:1,
            min: 0,
        })
    };

    ins = this.addInputs<CObject3D, typeof CLight["lightIns"]>(CLight.lightIns);

    get light(): Light
    {
        return this.object3D as Light;
    }

    update(context)
    {
        super.update(context);

        const light = this.light;
        const ins = this.ins;

        if (ins.name.changed) {
            this.node.name = ins.name.value;
        }

        if ((ins.tags.changed || ins.activeTags.changed) && ins.tags.value.length > 0) {
            const tags = ins.tags.value.split(",").map(tag => tag.trim()).filter(tag => tag);
            const activeTags = ins.activeTags.value.split(",").map(tag => tag.trim()).filter(tag => tag);

            const hasActiveTag: boolean = activeTags.some(activeTag => tags.indexOf(activeTag) >= 0)
            this.ins.enabled.setValue(!tags.length || hasActiveTag); 
        }

        if (ins.tags.changed && ins.tags.value.length > 0) {
            this.emit<ITagUpdateEvent>({ type: "tag-update" });
        }
        
        if(ins.enabled.changed) {
            light.visible = ins.enabled.value;
            this.node.emit<INodeChangeEvent>({ type: "change", what: "enabled", node: this.node });
        }

        if (ins.color.changed || ins.intensity.changed) {
            light.color.fromArray(ins.color.value);
            light.intensity = ins.intensity.value;
        }

        //some lights, like ambient and hemisphere light don't have shadows
        if("shadow" in light){
            if (ins.shadowEnabled.changed) {
                light.castShadow = ins.shadowEnabled.value;
            }

            if(ins.shadowBlur.changed){
                light.shadow.radius = ins.shadowBlur.value;
            }

            if(ins.shadowIntensity.changed){
                light.shadow.intensity = ins.shadowIntensity.value;
            }
                
            if (ins.shadowResolution.changed) {
                const mapResolution = _mapResolution[ins.shadowResolution.getValidatedValue()];
                light.shadow.mapSize.set(mapResolution, mapResolution);
                light.shadow.map = null; // TODO: check for resource leak
            }
        }

        return true;
    }
}