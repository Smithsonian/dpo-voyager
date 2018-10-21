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
import SelectionGroup, { ISelectionGroupSelectEvent } from "@ff/react/SelectionGroup";
import PropertyField, { IPropertyFieldChangeEvent, IPropertyFieldFormat } from "@ff/react/PropertyField";

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
        className: "sv-pose-editor"
    };

    constructor(props: IPoseEditorProps)
    {
        super(props);
    }

    render()
    {
        const {
            className,
            system
        } = this.props;

        return (
            <div
                className={className}>
                <label>Position</label>
                <Slider id="px" onChange={this.onSliderChange} value={0}>X</Slider>
                <Slider id="py" onChange={this.onSliderChange} value={0}>Y</Slider>
                <Slider id="pz" onChange={this.onSliderChange} value={0}>Z</Slider>
                <label>Rotation</label>
                <Slider id="rx" onChange={this.onSliderChange} value={0}>X</Slider>
                <Slider id="ry" onChange={this.onSliderChange} value={0}>Y</Slider>
                <Slider id="rz" onChange={this.onSliderChange} value={0}>Z</Slider>

            </div>
        );
    }

    protected onSliderChange(event: IPropertyFieldChangeEvent)
    {

    }
}