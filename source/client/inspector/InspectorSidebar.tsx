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

import FileDropArea from "./FileDropArea";
import InspectorEditor from "./InspectorEditor";
import { IInspectorSceneSettings } from "./InspectorScene";

////////////////////////////////////////////////////////////////////////////////

export interface IInspectorSidebarProps
{
    className?: string;
    style?: CSSProperties;
    settings?: IInspectorSceneSettings;
    onFile?: (file: File, slot: string) => void;
    onEnabled?: (enabled: boolean, slot: string) => void;
    onSettings?: (settings: IInspectorSceneSettings) => void;
}

export default class InspectorSidebar extends React.Component<IInspectorSidebarProps, {}>
{
    static defaultProps: IInspectorSidebarProps = {
        className: "inspector-sidebar"
    };

    constructor(props: IInspectorSidebarProps)
    {
        super(props);
    }

    render()
    {
        const {
            className,
            style,
            settings,
            onFile,
            onEnabled,
            onSettings
        } = this.props;

        return (<div
            className={className}
            style={style}>

            <FileDropArea
                onFile={onFile}
                onEnabled={onEnabled}
            />
            <InspectorEditor
                settings={settings}
                onChange={onSettings}
            />
        </div>);
    }
}