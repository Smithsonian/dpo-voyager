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

import * as THREE from "three";

import { types } from "@ff/graph/propertyTypes";

import Scene from "@ff/scene/components/Scene";
import HomeGrid from "./HomeGrid";
import View from "./View";
import Renderer from "./Renderer";
import Reader from "./Reader";

import ExplorerComponent from "../ExplorerComponent";
import Model from "../../core/components/Model";
import { IComponentEvent } from "@ff/graph/ComponentSet";
import ExplorerSystem from "../ExplorerSystem";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new THREE.Vector3();


export default class Explorer extends ExplorerComponent
{
    static readonly type: string = "Explorer";

    protected scene: Scene;
    protected grid: HomeGrid;
    protected view: View;

    protected boundingBox = new THREE.Box3();


    ins = this.ins.append({
        visible: types.Boolean_true("Interface.Visible"),
        logo: types.Boolean_true("Interface.Logo"),
    });


    create()
    {
        const node = this.node;

        this.scene = node.createComponent(Scene);
        this.grid = node.createComponent(HomeGrid);
        this.view = node.createComponent(View);

        node.createComponent(Renderer);
        node.createComponent(Reader);

        // scene background
        this.scene.scene.background = new THREE.TextureLoader().load("images/bg-gradient-blue.jpg");

        this.system.components.on(Model, this.onModelComponent, this);
    }

    dispose()
    {
        super.dispose();
        this.system.components.off(Model, this.onModelComponent, this);
    }

    update()
    {
        const system = this.system;
        const { visible, logo } = this.ins;

        if (visible.changed) {
            system.interfaceController.visible = visible.value;
        }
        if (logo.changed) {
            system.interfaceController.logo = logo.value;
        }

        return true;
    }

    protected onModelComponent(event: IComponentEvent<Model>)
    {
        if (event.add) {
            event.component.on(Model.updateEvent, this.onModelUpdate, this);
        }
        else if (event.remove) {
            event.component.off(Model.updateEvent, this.onModelUpdate, this);
        }
    }

    protected onModelUpdate()
    {
        // get bounding box of all models
        const box = this.boundingBox.makeEmpty();
        const models = this.graph.components.getArray(Model);

        for (let model of models) {
            box.expandByObject(model.object3D);
        }

        box.getSize(_vec3);
        const maxLength = Math.max(_vec3.x, _vec3.y, _vec3.z);

        // adjust view controller/main camera
        const { maxOffset, offset } = this.view.ins;
        maxOffset.value[2] = maxLength * 3;
        maxOffset.set();
        offset.value[2] = maxLength * 1.5;
        offset.set();

        // adjust additional viewport cameras
        const system = this.system as ExplorerSystem;
        system.views.forEach(view => {
            view.viewports.forEach(viewport => {
                const camera = viewport.viewportCamera;
                const manip = viewport.manip;
                if (manip && camera) {
                    manip.maxOffset.z = maxLength * 3;
                    manip.offset.z = maxLength * 1.5;
                    camera.far = maxLength * 6;
                }
            });
        });

        // adjust grid
        let gridSize = this.grid.ins.size.value;
        while (gridSize < maxLength) {
            gridSize *= 2;
        }

        this.grid.ins.size.setValue(gridSize);
    }
}