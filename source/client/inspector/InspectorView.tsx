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

import * as React from "react";

import FlexContainer from "@ff/react/FlexContainer";
import FlexItem from "@ff/react/FlexItem";

import Canvas3D from "./Canvas3D";

import InspectorMenubar from "./InspectorMenubar";
import InspectorSidebar from "./InspectorSidebar";
import InspectorScene, { IInspectorSceneInfo, IInspectorSceneSettings } from "./InspectorScene";

////////////////////////////////////////////////////////////////////////////////

export interface IInspectorViewProps
{
    className?: string;
}

interface IInspectorViewState
{
    sceneInfo: IInspectorSceneInfo;
}

export default class InspectorView extends React.Component<IInspectorViewProps, IInspectorViewState>
{
    static defaultProps: IInspectorViewProps = {
        className: "inspector"
    };

    protected scene: InspectorScene;
    protected sceneSettings: IInspectorSceneSettings;

    constructor(props: IInspectorViewProps)
    {
        super(props);

        this.state = {
            sceneInfo: null
        };

        this.sceneSettings = {
            exposure: 1,
            lights: 1,
            environment: 1,
            roughness: 0.75,
            metalness: 0,
            wireframe: false,
            occlusion: [ 0.33, 0.33, 0.33 ],
            objectNormals: false
        };

        this.scene = new InspectorScene(this.sceneSettings);

        this.onComponentFile = this.onComponentFile.bind(this);
        this.onComponentEnabled = this.onComponentEnabled.bind(this);
        this.onEditorSettings = this.onEditorSettings.bind(this);
        this.onSceneInfo = this.onSceneInfo.bind(this);

        this.scene.onInfo = this.onSceneInfo;
    }

    render()
    {
        return (<FlexContainer direction="vertical" position="fill">

            <InspectorMenubar sceneInfo={this.state.sceneInfo}/>

            <FlexContainer
                direction="horizontal">
                <InspectorSidebar
                    settings={this.sceneSettings}
                    onFile={this.onComponentFile}
                    onEnabled={this.onComponentEnabled}
                    onSettings={this.onEditorSettings}
                />
                <FlexItem>
                    <Canvas3D
                        scene={this.scene}
                        play={true}
                    />
                </FlexItem>
            </FlexContainer>

        </FlexContainer>);
    }

    protected onComponentFile(file: File, slot: string)
    {
        this.scene.setFile(file, slot);
    }

    protected onComponentEnabled(enabled: boolean, slot: string)
    {
        this.scene.setEnabled(enabled, slot);
    }

    protected onEditorSettings(settings: IInspectorSceneSettings)
    {
        this.scene.setSettings(settings);
    }

    protected onSceneInfo(info: IInspectorSceneInfo)
    {
        this.setState({ sceneInfo: info });
    }
}