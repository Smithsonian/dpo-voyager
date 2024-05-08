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

import Node from "@ff/graph/Node";
import CFloor from "@ff/scene/components/CFloor";

import { types } from "@ff/graph/Component";

import { IFloor } from "client/schema/setup";
import CVScene from "./CVScene";
import { Vector3 } from "three";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new Vector3();

export default class CVFloor extends CFloor
{
    static readonly typeName: string = "CVFloor";

    static readonly text: string = "Floor";
    static readonly icon: string = "";

    protected static readonly floorAddIns = {
        autoSize: types.Boolean("Floor.AutoSize", true),
    };

    addIns = this.addInputs(CVFloor.floorAddIns);

    get settingProperties() {
        return [
            this.ins.visible,
            this.ins.position,
            this.ins.radius,
            this.ins.color,
            this.ins.opacity,
            this.ins.receiveShadow,
            this.addIns.autoSize,
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.opacity,
        ];
    }

    protected get sceneNode() {
        return this.getSystemComponent(CVScene);
    }

    constructor(node: Node, id: string)
    {
        super(node, id);

        this.ins.visible.setValue(false);
        this.ins.receiveShadow.setValue(true);

        // make sure floor is rendered behind other transparent scene objects
        this.floor.renderOrder = -1;
    }

    create()
    {
        super.create();
        this.sceneNode.outs.boundingBox.on("value", this.recalculateSize, this);
    }

    dispose()
    {
        this.sceneNode.outs.boundingBox.off("value", this.recalculateSize, this);
        super.dispose();
    }

    update(context): boolean
    {
        const addIns = this.addIns;

        if (addIns.autoSize.changed && addIns.autoSize.value) {
            this.recalculateSize();
        }

        super.update(context);
        return true;
    }

    protected recalculateSize()
    {
        const {addIns} = this;

        if(addIns.autoSize.value) {
            const boundingBox = this.sceneNode.outs.boundingBox.value;
            boundingBox.getSize(_vec3 as unknown as Vector3);
            const size = Math.max(_vec3.x, _vec3.y, _vec3.z);
            const {min, max} = boundingBox;

            this.ins.radius.setValue(size);
            this.ins.position.setValue([(min.x+max.x)/2.0, min.y, (min.z+max.z)/2.0]);
        }
    }

    fromData(data: IFloor)
    {
        data = data || {} as IFloor;

        this.ins.copyValues({
            visible: !!data.visible,
            position: data.position || [ 0, -25, 0 ],
            radius: data.size !== undefined ? data.size : 50,
            color: data.color || [ 0.6, 0.75, 0.8 ],
            opacity: data.opacity !== undefined ? data.opacity : 0.5,
            receiveShadow: !!data.receiveShadow,
            autoSize: data.autoSize !== undefined ? data.autoSize : true
        });
    }

    toData(): IFloor
    {
        const ins = this.ins;

        return {
            visible: ins.visible.value,
            position: ins.position.cloneValue(),
            size: ins.radius.value,
            color: ins.color.cloneValue(),
            opacity: ins.opacity.value,
            receiveShadow: ins.receiveShadow.value,
            autoSize: this.addIns.autoSize.value
        };
    }
}