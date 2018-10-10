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

import FlexContainer from "@ff/react/FlexContainer";
import FlexItem from "@ff/react/FlexItem";
import Label from "@ff/react/Label";
import Button from "@ff/react/Button";
import Checkbox, { ICheckboxSelectEvent } from "@ff/react/Checkbox";
import FileDropTarget from "@ff/react/FileDropTarget";

////////////////////////////////////////////////////////////////////////////////

export interface IFileDropSlotProps
{
    className?: string;
    style?: CSSProperties;
    id?: string;
    title?: string;
    blank?: string;
    enabled?: boolean;
    fileTypes?: string;
    onFile?: (file: File, id: string, sender: FileDropSlot) => void;
    onEnabled?: (enabled: boolean, id: string, sender: FileDropSlot) => void;
}

interface IFileDropSlotState
{
    enabled: boolean;
    file: File;
}

export default class FileDropSlot extends React.Component<IFileDropSlotProps, IFileDropSlotState>
{
    static defaultProps: IFileDropSlotProps = {
        className: "file-slot"
    };

    constructor(props: IFileDropSlotProps)
    {
        super(props);

        this.state = {
            enabled: true,
            file: null
        };

        this.onEnabled = this.onEnabled.bind(this);
        this.onClear = this.onClear.bind(this);
        this.onFiles = this.onFiles.bind(this);
    }

    get enabled()
    {
        return this.state.enabled;
    }

    get file()
    {
        return this.state.file;
    }

    render()
    {
        const {
            className,
            style,
            title,
            blank,
            fileTypes
        } = this.props;

        const {
            enabled,
            file
        } = this.state;

        const blankContent = <span>
            <i className="fas fa-arrow-down" />&nbsp;{blank ? blank : "Drop file here"}
            </span>;

        return (<FlexContainer direction="vertical"
                               className={className}
                               style={style}>
            <label className="title">{title}</label>
            <FileDropTarget
                className={"file-drop-target " + (file ? "full" : "empty")}
                fileTypes={fileTypes}
                onFiles={this.onFiles}>
                <Label>{file ? file.name : blankContent}</Label>
            </FileDropTarget>
            <FlexContainer direction="horizontal" grow={0} alignItems="center">
                <Checkbox selectable text="Enabled" onSelect={this.onEnabled} selected={enabled} />
                <FlexItem />
                <Button text="Clear" onTap={this.onClear} />
            </FlexContainer>
        </FlexContainer>);
    }

    protected onEnabled(event: ICheckboxSelectEvent)
    {
        this.setState({ enabled: event.selected });

        if (this.props.onEnabled) {
            this.props.onEnabled(event.selected, this.props.id, this);
        }
    }

    protected onClear()
    {
        const file = null;
        this.setState({ file });

        if (this.props.onFile) {
            this.props.onFile(file, this.props.id, this);
        }
    }

    protected onFiles(files: FileList)
    {
        const file = files.length > 0 ? files.item(0) : null;
        this.setState({ file });

        if (this.props.onFile) {
            this.props.onFile(file, this.props.id, this);
        }
    }
}