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

import { EProjectionType, EViewPreset } from "common/types";

////////////////////////////////////////////////////////////////////////////////

export interface IViewportMenuSelectEvent extends IButtonTapEvent { viewportIndex: number }

/** Properties for [[ViewportMenu]] component. */
export interface IViewportMenuProps extends IComponentProps
{
    viewportIndex: number;
    projection: EProjectionType;
    viewPreset: EViewPreset
    onSelectProjection?: (event: IViewportMenuSelectEvent) => void;
    onSelectViewPreset?: (event: IViewportMenuSelectEvent) => void;
}

const ViewportMenu: React.SFC<IViewportMenuProps> = function(props)
{
    const {
        className,
        viewportIndex,
        projection,
        viewPreset,
        onSelectProjection,
        onSelectViewPreset
    } = props;

    const onTapProjection = (event: IButtonTapEvent) => onSelectProjection({ ...event, viewportIndex });
    const onTapViewPreset = (event: IButtonTapEvent) => onSelectViewPreset({ ...event, viewportIndex });

    return (
        <FlexContainer
            className={className}
            direction="vertical">

            <Label text="Projection"/>
            <FlexContainer
                className="group projection"
                direction="horizontal">

                <Button
                    index={EProjectionType.Perspective}
                    text="Perspective"
                    icon="fas fa-columns"
                    title="Perspective Projection"
                    selected={projection === EProjectionType.Perspective}
                    focused={projection === EProjectionType.Perspective}
                    onTap={onTapProjection} />

                <Button
                    index={EProjectionType.Orthographic}
                    text="Orthographic"
                    icon="fas fa-columns"
                    title="Orthographic Projection"
                    selected={projection === EProjectionType.Orthographic}
                    focused={projection === EProjectionType.Orthographic}
                    onTap={onTapProjection} />

            </FlexContainer>

            <Label text="View"/>
            <GridContainer
                className="group view"
                justifyContent="center" >

                <Button
                    index={EViewPreset.Top}
                    className="control button cube"
                    text="T"
                    title="Top View"
                    selected={viewPreset === EViewPreset.Top}
                    style={{gridColumnStart: 2, gridRowStart: 1}}
                    onTap={onTapViewPreset}/>

                <Button
                    index={EViewPreset.Left}
                    className="control button cube"
                    text="L"
                    title="Left View"
                    selected={viewPreset === EViewPreset.Left}
                    style={{gridColumnStart: 1, gridRowStart: 2}}
                    onTap={onTapViewPreset} />

                <Button
                    index={EViewPreset.Front}
                    className="control button cube"
                    text="F"
                    title="Front View"
                    selected={viewPreset === EViewPreset.Front}
                    style={{gridColumnStart: 2, gridRowStart: 2}}
                    onTap={onTapViewPreset} />

                <Button
                    index={EViewPreset.Right}
                    className="control button cube"
                    text="R"
                    title="Right View"
                    selected={viewPreset === EViewPreset.Right}
                    style={{gridColumnStart: 3, gridRowStart: 2}}
                    onTap={onTapViewPreset} />

                <Button
                    index={EViewPreset.Back}
                    className="control button cube"
                    text="B"
                    title="Back View"
                    selected={viewPreset === EViewPreset.Back}
                    style={{gridColumnStart: 4, gridRowStart: 2}}
                    onTap={onTapViewPreset} />

                <Button
                    index={EViewPreset.Bottom}
                    className="control button cube"
                    text="B" title="Bottom View"
                    selected={viewPreset === EViewPreset.Bottom}
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
