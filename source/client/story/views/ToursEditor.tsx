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

import FlexContainer from "@ff/react/FlexContainer";
import FlexItem from "@ff/react/FlexItem";
import Button from "@ff/react/Button";

import ToursEditController from "../components/ToursEditController";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[ToursEditor]] component. */
export interface IToursEditorProps
{
    className?: string;
    system: System;
}

export default class ToursEditor extends React.Component<IToursEditorProps, {}>
{
    static readonly defaultProps = {
        className: "sv-editor sv-tours-editor"
    };

    protected controller: ToursEditController = null;

    constructor(props: IToursEditorProps)
    {
        super(props);

        this.controller = props.system.getComponent(ToursEditController);
    }

    render()
    {
        const {
            className,
            system
        } = this.props;

        return (
            <FlexContainer
                className={className}
                direction="vertical"
                position="fill">

                <FlexContainer
                    className="sv-menu-bar"
                    direction="horizontal"
                    grow={0}>

                </FlexContainer>

            </FlexContainer>
        )
    }
}