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
import TabContainer, { ITabSelectEvent, TabItem } from "@ff/react/TabContainer";

import PrepController, { EPrepMode, IPrepModeChangeEvent } from "../components/PrepController";

import SettingsEditor from "./SettingsEditor";
import PoseEditor from "./PoseEditor";
import AnnotationsEditor from "./AnnotationsEditor";


////////////////////////////////////////////////////////////////////////////////

/** Properties for [[SideBar]] component. */
export interface ISideBarViewProps
{
    className?: string;
    system: System;
}

export default class SideBar extends React.Component<ISideBarViewProps, {}>
{
    static readonly defaultProps = {
        className: "sv-side-bar ff-tab-container"
    };

    protected controller: PrepController;

    constructor(props: ISideBarViewProps)
    {
        super(props);

        this.onTabSelect = this.onTabSelect.bind(this);

        this.controller = props.system.getComponent(PrepController);
    }

    componentDidMount()
    {
        this.controller.on("mode", this.onMode, this);
    }

    componentWillUnmount()
    {
        this.controller.off("mode", this.onMode, this);
    }

    render()
    {
        const {
            className,
            system
        } = this.props;

        const mode = this.controller.mode;

        return (
            <TabContainer
                className={className}
                activeTabIndex={mode}
                onTabSelect={this.onTabSelect}>

                <TabItem
                    index={EPrepMode.Explore}
                    title="Information"
                    faIcon="globe"
                    closable={false}
                    movable={false}>
                    <div>Explore</div>
                </TabItem>

                <TabItem
                    index={EPrepMode.Settings}
                    title="Settings"
                    faIcon="palette"
                    closable={false}
                    movable={false}>

                    <SettingsEditor
                        system={system}/>
                </TabItem>

                <TabItem
                    index={EPrepMode.Annotate}
                    title="Annotations"
                    faIcon="comment"
                    closable={false}
                    movable={false}>

                    <AnnotationsEditor
                        system={system}/>
                </TabItem>

                <TabItem
                    index={EPrepMode.Pose}
                    title="Pose"
                    faIcon="wrench"
                    closable={false}
                    movable={false}>

                    <PoseEditor
                        system={system}/>
                </TabItem>

            </TabContainer>
        );
    }

    protected onTabSelect(event: ITabSelectEvent)
    {
        this.controller.mode = event.tabIndex;
    }

    protected onMode(event: IPrepModeChangeEvent)
    {
        this.forceUpdate();
    }
}