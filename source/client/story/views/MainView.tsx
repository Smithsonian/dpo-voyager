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

import uniqueId from "@ff/core/uniqueId";

import FlexContainer from "@ff/react/FlexContainer";
import FlexItem from "@ff/react/FlexItem";

import { SplitterContainer, SplitterSection } from "@ff/react/Splitter";
import DockView from "@ff/react/DockView";
import { IDockLayout } from "@ff/react/DockController";
import ComponentFactory from "@ff/react/ComponentFactory";

import MenuBar from "./MenuBar";
import SideBar from "./SideBar";

import Application from "../Application";
import ExplorerView from "../../core/views/ExplorerView";
//import TestEditor from "./TestEditor";
import HierarchyView from "./HierarchyView";
import PropertyView from "./PropertyView";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[MainView]] component. */
export interface IMainViewProps
{
    className?: string;
    application: Application;
}

export default class MainView extends React.Component<IMainViewProps, {}>
{
    static readonly defaultProps = {
        className: "sv-main-view"
    };

    protected static readonly initialLayout: IDockLayout = {
        id: uniqueId(),
        type: "split",
        direction: "horizontal",
        size: 1,
        sections: [
            {
                type: "stack",
                id: uniqueId(),
                activePaneId: "",
                size: 0.7,
                panes: [
                    {
                        id: uniqueId(),
                        title: "Explorer",
                        closable: false,
                        componentId: "explorer-view"
                    }
                ]
            },
            {
                type: "split",
                id: uniqueId(),
                direction: "vertical",
                size: 0.3,
                sections: [
                    {
                        type: "stack",
                        id: uniqueId(),
                        activePaneId: "",
                        size: 0.6,
                        panes: [
                            {
                                id: uniqueId(),
                                title: "Hierarchy",
                                closable: false,
                                componentId: "hierarchy-view"
                            }
                        ]
                    },
                    {
                        type: "stack",
                        id: uniqueId(),
                        activePaneId: "",
                        size: 0.4,
                        panes: [
                            {
                                id: uniqueId(),
                                title: "Properties",
                                closable: false,
                                componentId: "property-view"
                            }
                        ]
                    }
                ]
            }
        ]
    };

    protected componentFactory: ComponentFactory;

    constructor(props: IMainViewProps)
    {
        super(props);

        const application = props.application;

        application.dockableController.setState(
            Object.assign({}, MainView.initialLayout)
        );

        this.componentFactory = new ComponentFactory([
            // {
            //     id: "property-editor", factory: () =>
            //         <TestEditor />
            // },
            {
                id: "explorer-view", factory: () =>
                    <ExplorerView
                        system={application.system} />
            },
            {
                id: "hierarchy-view", factory: () =>
                    <HierarchyView
                        controller={application.selectionController}/>
            },
            {
                id: "property-view", factory: () =>
                    <PropertyView
                        controller={application.selectionController}/>
            }
        ]);
    }

    render()
    {
        const application = this.props.application;

        return (
            <FlexContainer
                className={this.props.className}
                position="fill"
                direction="vertical">

                <MenuBar
                    controller={application.prepController}/>

                <FlexItem>
                    <SplitterContainer
                        direction="horizontal"
                        resizeEvent={true}>

                        <SplitterSection
                            size={0.22}>
                            <SideBar
                                system={application.system} />
                        </SplitterSection>

                        <SplitterSection
                            size={0.78}>
                            <DockView
                                factory={this.componentFactory}
                                controller={application.dockableController}/>
                        </SplitterSection>

                    </SplitterContainer>
                </FlexItem>
            </FlexContainer>
        );
    }
}