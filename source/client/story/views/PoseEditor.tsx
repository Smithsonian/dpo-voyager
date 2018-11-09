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

import Label from "@ff/react/Label";
import SelectionGroup, { ISelectionGroupSelectEvent } from "@ff/react/SelectionGroup";
import PropertyField, { IPropertyFieldChangeEvent, IPropertyFieldFormat } from "@ff/react/PropertyField";

import PoseEditController, { EPoseEditMode } from "../components/PoseEditController";

////////////////////////////////////////////////////////////////////////////////

const Slider = function(props)
{
    const fieldFormat: IPropertyFieldFormat = {
        type: "number",
        min: props.min, max: props.max, step: props.step, precision: props.precision || 3, bar: props.bar
    };

    return (<FlexContainer direction="horizontal" className="sv-slider">
        <Label>{props.children}</Label>
        <PropertyField id={props.id} value={props.value} format={fieldFormat} onChange={props.onChange} />
    </FlexContainer>)
};

/** Properties for [[PoseEditor]] component. */
export interface IPoseEditorProps
{
    className?: string;
    system: System;
}

export default class PoseEditor extends React.Component<IPoseEditorProps, {}>
{
    static readonly defaultProps = {
        className: "sv-editor sv-pose-editor"
    };

    protected controller: PoseEditController = null;

    constructor(props: IPoseEditorProps)
    {
        super(props);

        this.onSelectMode = this.onSelectMode.bind(this);
        this.controller = props.system.getComponent(PoseEditController);
    }

    componentDidMount()
    {
    }

    componentWillUnmount()
    {
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

                    <SelectionGroup
                        mode="exclusive"
                        onSelect={this.onSelectMode}>

                        <Button
                            index={EPoseEditMode.Translate}
                            text="Translate"
                            faIcon="arrows-alt"/>
                        <Button
                            index={EPoseEditMode.Rotate}
                            text="Rotate"
                            faIcon="sync"/>
                        <Button
                            index={EPoseEditMode.Scale}
                            text="Scale"
                            faIcon="arrows-alt-v"/>
                    </SelectionGroup>

                </FlexContainer>

                <FlexItem/>

            </FlexContainer>
        );
    }

    protected onSelectMode(event: ISelectionGroupSelectEvent)
    {
        let mode = event.selectionIndex as EPoseEditMode;
        if (mode === -1) {
            mode = EPoseEditMode.Select;
        }

        this.controller.setMode(mode);
    }

    protected onSliderChange(event: IPropertyFieldChangeEvent)
    {

    }
}