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
import Label from "@ff/react/Label";
import LineEdit from "@ff/react/LineEdit";
import TextEdit from "@ff/react/TextEdit";

import AnnotationsEditController from "../components/AnnotationsEditController";
import FlexItem from "@ff/react/FlexItem";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[AnnotationsDetailView]] component. */
export interface IAnnotationsDetailViewProps
{
    className?: string;
    system: System;
}

interface IAnnotationsDetailViewState
{
}

export default class AnnotationsDetailView extends React.Component<IAnnotationsDetailViewProps, IAnnotationsDetailViewState>
{
    static readonly defaultProps = {
        className: "sv-editor sv-annotations-detail-view"
    };

    protected controller: AnnotationsEditController;

    constructor(props: IAnnotationsDetailViewProps)
    {
        super(props);

        this.state = {
        };
    }

    render()
    {
        const {
            className,
            system,
        } = this.props;

        return (
            <FlexContainer
                className={className}
                position="fill"
                direction="vertical">

                <Label
                    text="Title"/>
                <LineEdit
                    text="Hello"/>

                <Label
                    text="Description"/>
                <TextEdit
                    text="World"/>

                <Label
                    text="Groups"/>

            </FlexContainer>
        );
    }
}