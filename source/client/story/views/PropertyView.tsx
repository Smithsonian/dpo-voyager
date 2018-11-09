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
import PropertyTreeView from "@ff/react/PropertyTreeView";

import SelectionController, { ISelectComponentEvent } from "../components/SelectionController";

////////////////////////////////////////////////////////////////////////////////

export interface IPropertyViewProps
{
    className?: string;
    controller: SelectionController;
}

export default class PropertyView extends React.Component<IPropertyViewProps, {}>
{
    static readonly defaultProps = {
        className: "sv-editor sv-property-view"
    };

    componentDidMount()
    {
        this.props.controller.on("component", this.onSelectComponent, this);
    }

    componentWillUnmount()
    {
        this.props.controller.off("component", this.onSelectComponent, this);
    }

    render()
    {
        const {
            className,
            controller
        } = this.props;

        const component = controller.getSelectedComponents()[0];
        const ins = component ? component.ins : null;
        const outs = component ? component.outs : null;

        return (
            <FlexContainer
                className={className}
                position="fill"
                direction="vertical">

                <FlexItem
                    className="sv-scroll-wrapper">

                    {ins ? <PropertyTreeView
                        key={component.id + "ins"}
                        name="Inputs"
                        propertySet={ins} /> : null}

                    {outs ? <PropertyTreeView
                        key={component.id + "outs"}
                        name="Outputs"
                        propertySet={component ? component.outs : null} /> : null}

                    {!ins && !outs ? <div>
                        Select a component to display its properties.
                    </div> : null}

                </FlexItem>

            </FlexContainer>
        );
    }

    protected onSelectComponent(event: ISelectComponentEvent)
    {
        this.forceUpdate();
    }
}