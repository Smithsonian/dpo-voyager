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

import FileDropSlot from "./FileDropSlot";

////////////////////////////////////////////////////////////////////////////////

export interface IFileDropAreaProps
{
    className?: string;
    style?: CSSProperties;
    onFile?: (file: File, slot: string) => void;
    onEnabled?: (enabled: boolean, slot: string) => void;
}

export default class FileDropArea extends React.Component<IFileDropAreaProps, {}>
{
    static defaultProps: IFileDropAreaProps = {
        className: "sv-file-drop-area"
    };

    constructor(props: IFileDropAreaProps)
    {
        super(props);
    }

    render()
    {
        const {
            className,
            style,
            onFile,
            onEnabled
        } = this.props;

        return (<div
            className={className}
            style={style}>

            <FileDropSlot
                id="mesh"
                title="Mesh"
                blank="Drop OBJ, PLY, GLB file here"
                fileTypes="obj,ply,glb"
                onFile={onFile}
                onEnabled={onEnabled}
            />
            <FileDropSlot
                id="diffuse"
                title="Diffuse Map"
                blank="Drop JPG, PNG file here"
                fileTypes="jpg,png"
                onFile={onFile}
                onEnabled={onEnabled}
            />
            <FileDropSlot
                id="occlusion"
                title="Occlusion Map"
                blank="Drop JPG, PNG file here"
                fileTypes="jpg,png"
                onFile={onFile}
                onEnabled={onEnabled}
            />
            <FileDropSlot
                id="normal"
                title="Normal Map"
                blank="Drop JPG, PNG file here"
                fileTypes="jpg,png"
                onFile={onFile}
                onEnabled={onEnabled}
            />
        </div>);
    }
}