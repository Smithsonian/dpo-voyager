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
import PopupButton from "@ff/react/PopupButton";
import Button, { IButtonTapEvent } from "@ff/react/Button";

import SystemController from "../components/SystemController";
import Explorer from "../components/Explorer";
import Reader from "../components/Reader";

import ViewportMenu from "./ViewportMenu";
import RenderMenu from "./RenderMenu";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[PresentationMenuView]] component. */
export interface IPopupMenuBarProps
{
    className?: string;
    system: System;
    portal?: React.Component<any, any>;
}

export default class PopupMenuBar extends React.Component<IPopupMenuBarProps, {}>
{
    static readonly defaultProps = {
        className: "sv-popup-menu-bar"
    };

    protected controller: SystemController;

    constructor(props: IPopupMenuBarProps)
    {
        super(props);

        this.onTapAnnotations = this.onTapAnnotations.bind(this);
        this.onTapArticle = this.onTapArticle.bind(this);

        this.controller = props.system.getComponent(SystemController);
    }

    componentDidMount()
    {
        this.controller.addInputListener(Explorer, "Annotations.Enabled", this.onPropertyChange, this);
        this.controller.addInputListener(Reader, "Enabled", this.onPropertyChange, this);
    }

    componentWillUnmount()
    {
        this.controller.removeInputListener(Explorer, "Annotations.Enabled", this.onPropertyChange, this);
        this.controller.removeInputListener(Reader, "Enabled", this.onPropertyChange, this);
    }

    render()
    {
        const {
            className,
            system,
            portal
        } = this.props;

        const annotationsVisible = this.controller.getInputValue(Explorer, "Annotations.Enabled");
        const readerVisible = this.controller.getInputValue(Reader, "Enabled");

        return (
            <FlexContainer
                className={className}
                direction="horizontal" >

                <PopupButton
                    portal={portal}
                    anchor="bottom"
                    modal={true}
                    icon="fas fa-eye"
                    title="View/Projection Settings">
                    <ViewportMenu
                        className="sv-explorer-popup-menu sv-viewport-menu"
                        system={system} />
                </PopupButton>

                <PopupButton
                    portal={portal}
                    anchor="bottom"
                    modal={true}
                    icon="fas fa-paint-brush"
                    title="Render Mode">
                    <RenderMenu
                        className="sv-explorer-popup-menu sv-render-menu"
                        system={system} />
                </PopupButton>

                <Button
                    className="ff-popup-button"
                    icon="fas fa-comment-alt"
                    selected={annotationsVisible}
                    onTap={this.onTapAnnotations}/>

                <Button
                    className="ff-popup-button"
                    icon="fas fa-file-alt"
                    selected={readerVisible}
                    onTap={this.onTapArticle}/>

            </FlexContainer>
        );
    }

    protected onTapAnnotations(event: IButtonTapEvent)
    {
        const visible = this.controller.getInputValue(Explorer, "annotations");
        this.controller.actions.setInputValue(Explorer, "annotations", !visible);
    }

    protected onTapArticle()
    {
        const visible = this.controller.getInputValue(Reader, "enabled");
        this.controller.actions.setInputValue(Reader, "enabled", !visible);
    }

    protected onPropertyChange()
    {
        this.forceUpdate();
    }
}