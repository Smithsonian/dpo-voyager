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
import FlexItem from "@ff/react/FlexItem";

import SelectionController from "../controllers/SelectionController";
import HierarchyTreeView from "./HierarchyTreeView";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[HierarchyView]] component. */
export interface IHierarchyViewProps
{
    className?: string;
    controller: SelectionController;
}

export default class HierarchyView extends React.Component<IHierarchyViewProps, {}>
{
    static readonly defaultProps = {
        className: "hierarchy-view"
    };

    render()
    {
        const {
            className,
            controller
        } = this.props;

        return (
            <FlexContainer
                className={className}
                position="fill"
                direction="vertical">

                <FlexItem
                    className="scroll-wrapper">

                    <HierarchyTreeView
                        controller={controller} />

                </FlexItem>

            </FlexContainer>
        );
    }


}