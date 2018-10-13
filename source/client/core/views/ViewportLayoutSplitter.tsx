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
import { SplitterContainer, SplitterSection } from "@ff/react/Splitter";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[ViewportLayoutSplitter]] component. */
export interface IViewportLayoutSplitterProps
{
    className?: string;
}

export default class ViewportLayoutSplitter extends React.Component<IViewportLayoutSplitterProps, {}>
{
    static readonly defaultProps: IViewportLayoutSplitterProps = {
        className: "viewport-layout-splitter"
    };

    constructor(props: IViewportLayoutSplitterProps)
    {
        super(props);
    }

    render()
    {
        const {
            className
        } = this.props;


        return (
            <div
                className={className} >

                <SplitterContainer
                    direction="horizontal">

                    <SplitterSection
                        className="splitter-section horizontal">
                        <div>x</div>
                    </SplitterSection>

                    <SplitterSection>
                        <div>x</div>
                    </SplitterSection>
                </SplitterContainer>

                <SplitterContainer
                    direction="vertical">

                    <SplitterSection
                        className="splitter-section vertical">
                        <div>x</div>
                    </SplitterSection>

                    <SplitterSection>
                        <div>x</div>
                    </SplitterSection>
                </SplitterContainer>

            </div>
        );
    }
}