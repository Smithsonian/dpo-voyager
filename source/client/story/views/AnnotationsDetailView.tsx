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
import LineEdit, { ILineEditChangeEvent } from "@ff/react/LineEdit";
import TextEdit, { ITextEditChangeEvent } from "@ff/react/TextEdit";

import AnnotationsEditController, { IAnnotationsChangeEvent } from "../components/AnnotationsEditController";
import FlexItem from "@ff/react/FlexItem";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[AnnotationsDetailView]] component. */
export interface IAnnotationsDetailViewProps
{
    className?: string;
    system: System;
}

export default class AnnotationsDetailView extends React.Component<IAnnotationsDetailViewProps, {}>
{
    static readonly defaultProps = {
        className: "sv-editor-pane sv-annotations-detail-view"
    };

    protected controller: AnnotationsEditController = null;
    protected isEditing = false;

    constructor(props: IAnnotationsDetailViewProps)
    {
        super(props);
        this.onTitleChange = this.onTitleChange.bind(this);
        this.onDescriptionChange = this.onDescriptionChange.bind(this);
    }

    componentWillMount()
    {
        this.controller = this.props.system.getComponent(AnnotationsEditController);
        this.controller.on("change", this.onControllerChange, this);
    }

    componentWillUnmount()
    {
        this.controller.off("change", this.onControllerChange, this);
    }

    render()
    {
        const selectedAnnotation = this.controller.getSelectedAnnotation();

        return (
            <FlexContainer
                className={this.props.className}
                position="fill"
                direction="vertical">

                <Label
                    text="Title"/>
                <LineEdit
                    text={selectedAnnotation ? selectedAnnotation.title : ""}
                    onChange={this.onTitleChange}/>

                <Label
                    text="Description"/>
                <TextEdit
                    text={selectedAnnotation ? selectedAnnotation.description : ""}
                    onChange={this.onDescriptionChange}/>

                <Label
                    text="Groups"/>

            </FlexContainer>
        );
    }

    protected onTitleChange(event: ILineEditChangeEvent)
    {
        this.isEditing = true;
        this.controller.actions.setTitle(event.text);
        this.isEditing = false;
    }

    protected onDescriptionChange(event: ITextEditChangeEvent)
    {
        this.isEditing = true;
        this.controller.actions.setDescription(event.text);
        this.isEditing = false;
    }

    protected onControllerChange(event: IAnnotationsChangeEvent)
    {
        if (!this.isEditing) {
            this.forceUpdate();
        }
    }
}