/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Scene, Camera } from "three";

import Component, { types } from "@ff/graph/Component";
import { IComponentEvent } from "@ff/graph/System"

import CScene from "./CScene";
import CCamera from "./CCamera";

////////////////////////////////////////////////////////////////////////////////

const ins = {
    scene: types.Option("Scene", []),
    camera: types.Option("Camera", [])
};

export default class CMain extends Component
{
    static readonly typeName: string = "CMain";

    protected scenes: CScene[] = [];
    protected cameras: CCamera[] = [];

    protected selectedScene: CScene = null;
    protected selectedCamera: CCamera = null;

    ins = this.addInputs(ins);

    get sceneComponent(): CScene | null {
        return this.selectedScene;
    }

    get cameraComponent(): CCamera | null {
        return this.selectedCamera;
    }

    get scene(): Scene | null {
        return this.selectedScene ? this.selectedScene.scene : null;
    }

    get camera(): Camera | null {
        return this.selectedCamera ? this.selectedCamera.camera : null;
    }

    create()
    {
        super.create();

        this.scenes = this.system.components.cloneArray(CScene);
        this.system.components.on(CScene, this.onSceneComponent, this);

        this.cameras = this.system.components.cloneArray(CCamera);
        this.system.components.on(CCamera, this.onCameraComponent, this);

        this.updateOptions();
    }

    update()
    {
        const ins = this.ins;

        if (ins.scene.changed) {
            const index = ins.scene.getValidatedValue();
            this.selectedScene = index >= 0 ? this.scenes[index] : null;
        }
        if (ins.camera.changed) {
            const index = ins.camera.getValidatedValue();
            this.selectedCamera = index >= 0 ? this.cameras[index] : null;
        }

        return true;
    }

    dispose()
    {
        this.system.components.off(CScene, this.onSceneComponent, this);
        this.system.components.off(CCamera, this.onCameraComponent, this);
    }

    protected onSceneComponent(event: IComponentEvent<CScene>)
    {
        const inScene = this.ins.scene;

        if (event.add) {
            this.scenes.push(event.object);
            this.updateOptions();
        }
        else {
            const index = this.scenes.indexOf(event.object);
            this.scenes.splice(index, 1);

            this.updateOptions();

            if (!inScene.hasInLinks() && index <= inScene.value) {
                inScene.setValue(Math.max(0, inScene.value - 1));
            }
        }

        inScene.set();
    }

    protected onCameraComponent(event: IComponentEvent<CCamera>)
    {
        const inCamera = this.ins.camera;

        if (event.add) {
            this.cameras.push(event.object);
            this.updateOptions();
        }
        else {
            const index = this.cameras.indexOf(event.object);
            this.cameras.splice(index, 1);

            this.updateOptions();

            if (!inCamera.hasInLinks() && index <= inCamera.value) {
                inCamera.setValue(Math.max(0, inCamera.value - 1));
            }
        }

        inCamera.set();
    }

    protected updateOptions()
    {
        const { scene, camera } = this.ins;

        if (this.scenes.length > 0) {
            scene.setOptions(this.scenes.map(scene => scene.name || scene.typeName));
        }
        else {
            scene.setOptions([ "N/A" ]);
        }

        if (this.cameras.length > 0) {
            camera.setOptions(this.cameras.map(camera => camera.name || camera.typeName));
        }
        else {
            camera.setOptions([ "N/A" ]);
        }
    }
}