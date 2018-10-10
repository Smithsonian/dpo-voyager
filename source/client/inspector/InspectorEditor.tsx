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
import { CSSProperties } from "react";

import FlexContainer from "@ff/react/FlexContainer";
import Label from "@ff/react/Label";
import Checkbox, { ICheckboxSelectEvent } from "@ff/react/Checkbox";
import SelectionGroup, { ISelectionGroupSelectEvent } from "@ff/react/SelectionGroup";
import PropertyField, { IPropertyFieldChangeEvent, IPropertyFieldFormat } from "@ff/react/PropertyField";

import { IInspectorSceneSettings } from "./InspectorScene";

////////////////////////////////////////////////////////////////////////////////

const Slider = function(props)
{
    const fieldFormat: IPropertyFieldFormat = {
        type: "number",
        min: props.min || 0, max: props.max || 1, step: 0.01, precision: 2, bar: true
    };

    return (<FlexContainer direction="horizontal" className="slider">
        <Label>{props.children}</Label>
        <PropertyField id={props.id} value={props.value} format={fieldFormat} onChange={props.onChange} />
    </FlexContainer>)
};

const Switch = function(props)
{
    return (<FlexContainer direction="horizontal" className="switch">
        <Label>{props.children}</Label>
        <Checkbox id={props.id} text={props.text} onSelect={props.onSelect} />
    </FlexContainer>)
};

export interface IInspectorEditorProps
{
    className?: string;
    style?: CSSProperties;
    settings: IInspectorSceneSettings;
    onChange?: (settings: IInspectorSceneSettings) => void;
}

export default class InspectorEditor extends React.Component<IInspectorEditorProps, {}>
{
    static defaultProps: IInspectorEditorProps = {
        className: "inspector-editor",
        settings: null
    };

    protected settings: IInspectorSceneSettings;

    constructor(props: IInspectorEditorProps)
    {
        super(props);

        this.onSliderChange = this.onSliderChange.bind(this);
        this.onSwitchSelect = this.onSwitchSelect.bind(this);
        this.onRadioSelect = this.onRadioSelect.bind(this);

        this.settings = Object.assign({}, props.settings);
    }

    componentWillReceiveProps(nextProps: IInspectorEditorProps)
    {
        this.settings = Object.assign({}, nextProps.settings);
    }

    render()
    {
        const {
            className,
            style,
            settings
        } = this.props;

        return (<div
            className={className}
            style={style}>
            <label>Environment</label>
            <Slider id="lights" onChange={this.onSliderChange} value={settings.lights} max={2}>Lights</Slider>
            <Slider id="environment" onChange={this.onSliderChange} value={settings.environment} max={2}>Environment</Slider>
            <Slider id="exposure" onChange={this.onSliderChange} value={settings.exposure} max={2}>Exposure</Slider>
            <label>Material</label>
            <Slider id="roughness" onChange={this.onSliderChange} value={settings.roughness}>Roughness</Slider>
            <Slider id="metalness" onChange={this.onSliderChange} value={settings.metalness}>Metalness</Slider>
            <Switch id="wireframe" onSelect={this.onSwitchSelect} text="Wireframe">Rendering</Switch>
            <label>Occlusion</label>
            <Slider id="occlusion0" onChange={this.onSliderChange} value={settings.occlusion[0]}>Large (R)</Slider>
            <Slider id="occlusion1" onChange={this.onSliderChange} value={settings.occlusion[1]}>Medium (G)</Slider>
            <Slider id="occlusion2" onChange={this.onSliderChange} value={settings.occlusion[2]}>Small (B)</Slider>
            <label>Normals</label>
            <SelectionGroup id="normalspace" selectionIndex={1} onSelect={this.onRadioSelect}>
                <span>Map</span>
                <Checkbox text="Object Space" shape="circle"/>
                <Checkbox text="Tangent Space" shape="circle"/>
            </SelectionGroup>
        </div>);
    }

    protected onSliderChange(event: IPropertyFieldChangeEvent)
    {
        const settings = this.settings;
        const value = event.value as number;

        switch(event.id) {
            case "occlusion0":
                settings.occlusion[0] = value; break;
            case "occlusion1":
                settings.occlusion[1] = value; break;
            case "occlusion2":
                settings.occlusion[2] = value; break;
            default:
                settings[event.id] = value; break;
        }

        if (this.props.onChange) {
            this.props.onChange(settings);
        }
    }

    protected onSwitchSelect(event: ICheckboxSelectEvent)
    {
        switch(event.id) {
            case "wireframe":
                this.settings.wireframe = event.selected; break;
        }

        if (this.props.onChange) {
            this.props.onChange(this.settings);
        }
    }

    protected onRadioSelect(event: ISelectionGroupSelectEvent)
    {
        switch(event.id) {
            case "normalspace":
                this.settings.objectNormals = event.index === 0;
                break;
        }

        if (this.props.onChange) {
            this.props.onChange(this.settings);
        }
    }
}