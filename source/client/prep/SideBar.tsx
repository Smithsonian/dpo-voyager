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

import TabContainer, { ITabSelectEvent, TabItem } from "@ff/react/TabContainer";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[SideBar]] component. */
export interface ISideBarProps
{
    className?: string;
    style?: CSSProperties;
}

export interface ISideBarState
{
    activeTabId: string;
}

export default class SideBar extends React.Component<ISideBarProps, ISideBarState>
{
    static readonly defaultProps: ISideBarProps = {
        className: "side-bar tab-container"
    };

    constructor(props: ISideBarProps)
    {
        super(props);

        this.onTabSelect = this.onTabSelect.bind(this);

        this.state = {
            activeTabId: ""
        };
    }

    render()
    {
        const {
            className
        } = this.props;

        return (
            <TabContainer
                className={className}
                activeTabId={this.state.activeTabId}
                onTabSelect={this.onTabSelect}>

                <TabItem
                    id="0"
                    title="Information"
                    faIcon="edit"
                    closable={false}
                    movable={false}>
                    <div>Information</div>
                </TabItem>

                <TabItem
                    id="1"
                    title="Transform"
                    faIcon="cog"
                    closable={false}
                    movable={false}>
                    <div>Transform</div>
                </TabItem>

                <TabItem
                    id="2"
                    title="Material"
                    faIcon="palette"
                    closable={false}
                    movable={false}>
                    <div>Material</div>
                </TabItem>

                <TabItem
                    id="3"
                    title="Annotations"
                    faIcon="comment"
                    closable={false}
                    movable={false}>
                    <div>Annotations</div>
                </TabItem>

                <TabItem
                    id="4"
                    title="Documents"
                    faIcon="book-reader"
                    closable={false}
                    movable={false}>
                    <div>Documents</div>
                </TabItem>

            </TabContainer>
        );
    }

    protected onTabSelect(event: ITabSelectEvent)
    {
        this.setState({ activeTabId: event.tabId });
    }
}