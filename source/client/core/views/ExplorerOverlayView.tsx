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
import FlexSpacer from "@ff/react/FlexSpacer";

import PopupMenuBar from "./PopupMenuBar";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[ExplorerMenuOverlay]] component. */
export interface IExplorerMenuOverlayProps
{
    className?: string;
    system: System;
}

export default class ExplorerOverlayView extends React.Component<IExplorerMenuOverlayProps, {}>
{
    static readonly defaultProps = {
        className: "sv-explorer-overlay-view"
    };

    constructor(props: IExplorerMenuOverlayProps)
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
            <FlexContainer
                className={className}
                position="fill"
                direction="vertical">

                <FlexContainer
                    direction="horizontal">

                    <PopupMenuBar
                        system={system}
                        portal={this}/>

                    <FlexSpacer/>

                </FlexContainer>

                <FlexSpacer/>

            </FlexContainer>
        );
    }
}