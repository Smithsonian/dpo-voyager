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

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[SettingsEditor]] component. */
export interface ISettingsEditorProps
{
    className?: string;
    system: System;
}

export default class SettingsEditor extends React.Component<ISettingsEditorProps, {}>
{
    static readonly defaultProps = {
        className: "sv-settings-editor"
    };

    constructor(props: ISettingsEditorProps)
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
            <div
                className={className} >
                Settings Mode
            </div>
        );
    }
}