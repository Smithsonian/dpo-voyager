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
import SystemController from "../components/SystemController";
import Reader from "../components/Reader";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[ReaderView]] component. */
export interface IReaderViewProps
{
    className?: string;
    system: System;
}

export default class ReaderView extends React.Component<IReaderViewProps, {}>
{
    static readonly defaultProps = {
        className: "sv-document-view"
    };

    protected controller: SystemController;
    protected ref: React.RefObject<HTMLDivElement>;

    constructor(props: IReaderViewProps)
    {
        super(props);

        this.controller = props.system.getComponent(SystemController);
        this.ref = React.createRef();
    }

    componentDidMount()
    {
        this.controller.addInputListener(Reader, "Enabled", this.onPropertyChange, this);
    }

    componentWillUnmount()
    {
        this.controller.removeInputListener(Reader, "Enabled", this.onPropertyChange, this);
    }

    render()
    {
        const enabled = this.controller.getInputValue(Reader, "Enabled");
        const content = this.controller.getOutputValue(Reader, "HTML");

        return (enabled ?
            <div
                ref={this.ref}
                className={this.props.className}>

                <div
                    className="sv-content"
                    dangerouslySetInnerHTML={{ __html: content }}/>
            </div>
        : null);
    }

    protected onPropertyChange()
    {
        this.forceUpdate();
    }
}