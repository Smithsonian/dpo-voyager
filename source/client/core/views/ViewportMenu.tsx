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
import GridContainer from "@ff/react/GridContainer";
import Label from "@ff/react/Label";
import Button, { IButtonTapEvent } from "@ff/react/Button";

import { ProjectionMode, ViewPreset } from "../components/PresentationController";

////////////////////////////////////////////////////////////////////////////////

export interface IViewportMenuSelectEvent extends IButtonTapEvent { index: number }

/** Properties for [[ViewportMenu]] component. */
export interface IViewportMenuProps extends IComponentProps
{
    index: number;
    projection: ProjectionMode;
    viewPreset: ViewPreset
    onSelectProjection?: (event: IViewportMenuSelectEvent) => void;
    onSelectViewPreset?: (event: IViewportMenuSelectEvent) => void;
}

const ViewportMenu: React.SFC<IViewportMenuProps> = function(props)
{
    const {
        className,
        index,
        projection,
        viewPreset,
        onSelectProjection,
        onSelectViewPreset
    } = props;

    const onTapProjection = (event: IButtonTapEvent) => onSelectProjection({ ...event, index });
    const onTapViewPreset = (event: IButtonTapEvent) => onSelectViewPreset({ ...event, index });

    return (
        <FlexContainer
            className={className}
            direction="vertical">

            <Label text="Projection"/>
            <FlexContainer
                className="group projection"
                direction="horizontal">

                <Button
                    id="perspective"
                    text="Perspective"
                    icon="fas fa-columns"
                    title="Perspective Projection"
                    selected={projection === "perspective"}
                    focused={projection === "perspective"}
                    onTap={onTapProjection} />

                <Button
                    id="orthographic"
                    text="Orthographic"
                    icon="fas fa-columns"
                    title="Orthographic Projection"
                    selected={projection === "orthographic"}
                    focused={projection === "orthographic"}
                    onTap={onTapProjection} />

            </FlexContainer>

            <Label text="View"/>
            <GridContainer
                className="group view"
                justifyContent="center" >

                <Button
                    id="top"
                    className="control button cube"
                    text="T"
                    title="Top View"
                    selected={viewPreset === "top"}
                    style={{gridColumnStart: 2, gridRowStart: 1}}
                    onTap={onTapViewPreset}/>

                <Button
                    id="left"
                    className="control button cube"
                    text="L"
                    title="Left View"
                    selected={viewPreset === "left"}
                    style={{gridColumnStart: 1, gridRowStart: 2}}
                    onTap={onTapViewPreset} />

                <Button
                    id="front"
                    className="control button cube"
                    text="F"
                    title="Front View"
                    selected={viewPreset === "front"}
                    style={{gridColumnStart: 2, gridRowStart: 2}}
                    onTap={onTapViewPreset} />

                <Button
                    id="right"
                    className="control button cube"
                    text="R"
                    title="Right View"
                    selected={viewPreset === "right"}
                    style={{gridColumnStart: 3, gridRowStart: 2}}
                    onTap={onTapViewPreset} />

                <Button
                    id="back"
                    className="control button cube"
                    text="B"
                    title="Back View"
                    selected={viewPreset === "back"}
                    style={{gridColumnStart: 4, gridRowStart: 2}}
                    onTap={onTapViewPreset} />

                <Button
                    id="bottom"
                    className="control button cube"
                    text="B" title="Bottom View"
                    selected={viewPreset === "bottom"}
                    style={{gridColumnStart: 2, gridRowStart: 3}}
                    onTap={onTapViewPreset} />

            </GridContainer>

        </FlexContainer>
    );
};

ViewportMenu.defaultProps = {
    className: "viewport-menu"
};

export default ViewportMenu;
