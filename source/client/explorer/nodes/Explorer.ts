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

import Node, { IComponentEvent } from "@ff/graph/Node";

import Transform from "@ff/scene/components/Transform";
import Scene from "@ff/scene/components/Scene";

import Model from "../../core/components/Model";

import ExplorerSystem from "../ExplorerSystem";

import HomeGrid from "../components/HomeGrid";
import View from "../components/View";
import Renderer from "../components/Renderer";
import Reader from "../components/Reader";
import Interface from "../components/Interface";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new THREE.Vector3();
const _box3 = new THREE.Box3();

/**
 * Root node for Voyager Explorer.
 */
export default class Explorer extends Node
{
    static readonly type: string = "Explorer";

    readonly system: ExplorerSystem;

    private _scene: Scene;
    private _grid: HomeGrid;
    private _view: View;

    protected boundingBox = new THREE.Box3();

    get transform() {
        return this._scene as Transform;
    }
    get grid() {
        return this._grid;
    }
    get view() {
        return this._view;
    }

    create()
    {
        this.name = "Explorer";

        this._scene = this.createComponent(Scene);
        this._grid = this.createComponent(HomeGrid);
        this._view = this.createComponent(View);

        this.createComponent(Renderer);
        this.createComponent(Reader);
        this.createComponent(Interface);

        // create grid node
        // const gridNode = this.graph.createNode(Node, "Grid");
        // const gridTransform = gridNode.createComponent(Transform);
        // gridNode.createComponent(Grid);
        // this.hierarchy.addChild(gridTransform);

        // scene background
        this._scene.scene.background = new THREE.TextureLoader().load("images/bg-gradient-blue.jpg");

        this.system.components.on(Model, this.onModelComponent, this);

    }

    dispose()
    {
        super.dispose();
        this.system.components.off(Model, this.onModelComponent, this);
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