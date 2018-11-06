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

import ReactMde, { ReactMdeTypes } from "react-mde";
import * as Showdown from "showdown";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[MarkdownEditor]] component. */
export interface IMarkdownEditorProps
{
    className?: string;
    style?: CSSProperties;
}

interface IMarkdownEditorState
{
    mdeState: ReactMdeTypes.MdeState
}

export default class MarkdownEditor extends React.Component<IMarkdownEditorProps, IMarkdownEditorState>
{
    static defaultProps: IMarkdownEditorProps = {
        className: "sv-markdown-editor"
    };

    private static style: CSSProperties = {
    };

    converter: Showdown.Converter;

    constructor(props: IMarkdownEditorProps)
    {
        super(props);

        this.onMdeChange = this.onMdeChange.bind(this);

        this.state = {
            mdeState: {
                markdown: "**Hello, World**"
            }
        };

        this.converter = new Showdown.Converter({ tables: true, simplifiedAutoLink: true });
    }

    render()
    {
        return (
            <div
                className={this.props.className}>

                <ReactMde
                    onChange={this.onMdeChange}
                    editorState={this.state.mdeState}
                    generateMarkdownPreview={(markdown) => Promise.resolve(this.converter.makeHtml(markdown))}
                />

            </div>
        );
    }

    onMdeChange(mdeState: ReactMdeTypes.MdeState)
    {
        this.setState({ mdeState });
    }
}