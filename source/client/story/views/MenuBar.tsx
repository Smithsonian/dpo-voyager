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

import FlexContainer from "@ff/react/FlexContainer";
import FlexSpacer from "@ff/react/FlexSpacer";
import Button from "@ff/react/Button";

import PrepController from "../components/PrepController";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[MenuBar]] component. */
export interface IMenuBarProps
{
    className?: string;
    controller: PrepController;
}

export default class MenuBar extends React.Component<IMenuBarProps, {}>
{
    static readonly defaultProps: Partial<IMenuBarProps> = {
        className: "sv-menu-bar"
    };

    constructor(props: IMenuBarProps)
    {
        super(props);

        this.onTapItem = this.onTapItem.bind(this);
        this.onTapPresentation = this.onTapPresentation.bind(this);
    }

    render()
    {
        const {
            className,
        } = this.props;

        return (
            <FlexContainer
                className={className}
                direction="horizontal"
                shrink={0}
                grow={0}
                alignItems="center">

                <img
                    className="sv-logo"
                    src="/images/voyager-75grey.svg"/>

                <FlexSpacer/>

                <Button
                    text="Item"
                    faIcon="file-download"
                    onTap={this.onTapItem}/>

                <Button
                    text="Presentation"
                    faIcon="file-download"
                    onTap={this.onTapPresentation}/>

            </FlexContainer>
        );
    }

    protected onTapItem()
    {
        this.props.controller.actions.downloadItem();
    }

    protected onTapPresentation()
    {
        this.props.controller.actions.downloadPresentation();
    }
}