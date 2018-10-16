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

import { IComponentProps } from "@ff/react/common";
import FlexContainer from "@ff/react/FlexContainer";
import Label from "@ff/react/Label";
import Button, { IButtonTapEvent } from "@ff/react/Button";

import { RenderMode } from "../components/PresentationController";

////////////////////////////////////////////////////////////////////////////////

export interface IRenderMenuSelectEvent extends IButtonTapEvent {}

export interface IRenderMenuProps extends IComponentProps
{
    renderMode: RenderMode;
    onSelectRenderMode?: (event: IRenderMenuSelectEvent) => void;
}

const RenderMenu: React.SFC<IRenderMenuProps> = function(props)
{
    const {
        className,
        onSelectRenderMode
    } = props;

    return (
        <FlexContainer
            className={className}
            direction="vertical">

            <Label text="Render mode"/>

            <Button
                id="standard"
                text="Standard"
                title="Display model in standard mode"
                focused={true}
                onTap={onSelectRenderMode} />

            <Button
                id="clay"
                text="Clay"
                title="Display model without colors"
                focused={true}
                onTap={onSelectRenderMode} />

            <Button
                id="normals"
                text="Normals"
                title="Display normals"
                focused={true}
                onTap={onSelectRenderMode} />

            <Button
                id="xray"
                text="X-Ray"
                title="Display model in X-Ray mode"
                focused={true}
                onTap={onSelectRenderMode} />

            <Button
                id="wireframe"
                text="Wireframe"
                title="Display model as wireframe"
                focused={true}
                onTap={onSelectRenderMode} />

        </FlexContainer>
    );
};

RenderMenu.defaultProps = {
    className: "render-menu"
};

export default RenderMenu;