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

import System from "@ff/core/ecs/System";

import { IComponentProps } from "@ff/react/common";
import FlexContainer from "@ff/react/FlexContainer";
import Label from "@ff/react/Label";
import Button, { IButtonTapEvent } from "@ff/react/Button";

import Renderer, { EShaderMode } from "../components/Renderer";
import SystemController from "../components/SystemController";

////////////////////////////////////////////////////////////////////////////////

export interface IRenderMenuProps extends IComponentProps
{
    className?: string;
    system: System;
}

export default class RenderMenu extends React.Component<IRenderMenuProps, {}>
{
    static readonly defaultProps = {
        className: "sv-render-menu"
    };

    protected controller: SystemController;

    constructor(props: IRenderMenuProps)
    {
        super(props);

        this.onSelectShaderMode = this.onSelectShaderMode.bind(this);

        this.controller = props.system.getComponent(SystemController);
    }

    componentDidMount()
    {
        this.controller.addInputListener(Renderer, "Shader", this.onPropertyChange, this);
    }

    componentWillUnmount()
    {
        this.controller.removeInputListener(Renderer, "Shader", this.onPropertyChange, this);
    }

    render()
    {
        const shaderMode = this.controller.getInputValue(Renderer, "Shader");

        return (
            <FlexContainer
                className={this.props.className}
                direction="vertical">

                <Label text="Render mode"/>

                <Button
                    index={EShaderMode.Default}
                    text="Standard"
                    title="Display model in standard mode"
                    selected={shaderMode === EShaderMode.Default}
                    focused={shaderMode === EShaderMode.Default}
                    onTap={this.onSelectShaderMode} />

                <Button
                    index={EShaderMode.Clay}
                    text="Clay"
                    title="Display model without colors"
                    selected={shaderMode === EShaderMode.Clay}
                    focused={shaderMode === EShaderMode.Clay}
                    onTap={this.onSelectShaderMode} />

                <Button
                    index={EShaderMode.XRay}
                    text="X-Ray"
                    title="Display model in X-Ray mode"
                    selected={shaderMode === EShaderMode.XRay}
                    focused={shaderMode === EShaderMode.XRay}
                    onTap={this.onSelectShaderMode} />

                <Button
                    index={EShaderMode.Normals}
                    text="Normals"
                    title="Display normals"
                    selected={shaderMode === EShaderMode.Normals}
                    focused={shaderMode === EShaderMode.Normals}
                    onTap={this.onSelectShaderMode} />

                <Button
                    index={EShaderMode.Wireframe}
                    text="Wireframe"
                    title="Display model as wireframe"
                    selected={shaderMode === EShaderMode.Wireframe}
                    focused={shaderMode === EShaderMode.Wireframe}
                    onTap={this.onSelectShaderMode} />

            </FlexContainer>
        );
    }

    protected onSelectShaderMode(event: IButtonTapEvent)
    {
        this.controller.setInputValue(Renderer, "shader", event.index);
    }

    protected onPropertyChange()
    {
        this.forceUpdate();
    }
};
