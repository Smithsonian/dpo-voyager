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

import { SplitterContainer, SplitterSection } from "@ff/react/Splitter";
import FlexContainer from "@ff/react/FlexContainer";
import FlexItem from "@ff/react/FlexItem";
import Button from "@ff/react/Button";

import AnnotationsListView from "./AnnotationsListView";
import AnnotationsDetailView from "./AnnotationsDetailView";
import SelectionGroup, { ISelectionGroupSelectEvent } from "@ff/react/SelectionGroup";
import AnnotationsEditController, { AnnotationsEditMode } from "../components/AnnotationsEditController";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[AnnotationsEditor]] component. */
export interface IAnnotationsEditorProps
{
    className?: string;
    system: System;
}

export default class AnnotationsEditor extends React.Component<IAnnotationsEditorProps, {}>
{
    static readonly defaultProps = {
        className: "sv-sidebar-editor"
    };

    protected controller: AnnotationsEditController = null;

    constructor(props: IAnnotationsEditorProps)
    {
        super(props);

        this.onSelectMode = this.onSelectMode.bind(this);
    }


    componentDidMount()
    {
        this.controller = this.props.system.getComponent(AnnotationsEditController);
    }

    componentWillUnmount()
    {

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
                direction="vertical"
                position="fill">

                <FlexContainer
                    className="sv-menu-bar"
                    direction="horizontal"
                    grow={0}>

                    <SelectionGroup
                        mode="exclusive"
                        onSelect={this.onSelectMode}>

                        <Button
                            index={AnnotationsEditMode.Create}
                            text="Create"/>
                        <Button
                            index={AnnotationsEditMode.Move}
                            text="Move"/>
                    </SelectionGroup>

                </FlexContainer>

                <FlexItem>
                    <SplitterContainer
                        direction="vertical">

                        <SplitterSection
                            size={0.5}>

                            <AnnotationsListView
                                system={system} />

                        </SplitterSection>

                        <SplitterSection
                            size={0.5}>

                            <AnnotationsDetailView
                                system={system} />

                        </SplitterSection>

                    </SplitterContainer>
                </FlexItem>
            </FlexContainer>
        );
    }

    protected onSelectMode(event: ISelectionGroupSelectEvent)
    {
        let mode = event.selectionIndex as AnnotationsEditMode;
        if (mode === -1) {
            mode = AnnotationsEditMode.Select;
        }

        this.controller.setMode(mode);
    }
}