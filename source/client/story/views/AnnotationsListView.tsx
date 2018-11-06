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

import AnnotationsEditController, { IAnnotation, IAnnotationsChangeEvent } from "../components/AnnotationsEditController";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[AnnotationListView]] component. */
export interface IAnnotationsListViewProps
{
    className?: string;
    system: System;
}

export default class AnnotationsListView extends React.Component<IAnnotationsListViewProps, {}>
{
    static readonly defaultProps = {
        className: "sv-editor-pane sv-annotations-list-view"
    };

    protected controller: AnnotationsEditController = null;

    componentWillMount()
    {
        this.controller = this.props.system.getComponent(AnnotationsEditController);
        this.controller.on("change", this.onControllerChange, this);
    }

    componentWillUnmount()
    {
        this.controller.off("change", this.onControllerChange, this);
    }

    render()
    {
        const annotations = this.controller.getActiveAnnotations();
        const selectedAnnotation = this.controller.getSelectedAnnotation();

        const list = annotations ? annotations.getArray().map(annotation =>
            <div
                key={annotation.id}
                className={"sv-item" + (annotation === selectedAnnotation ? " sv-selected" : "")}
                onClick={() => this.onClick(annotation)}>
                {annotation.title}
                </div>
        ) : null;

        return (
            <div
                className={this.props.className}>
                {list}
            </div>
        );
    }

    protected onControllerChange(event: IAnnotationsChangeEvent)
    {
        this.forceUpdate();
    }

    protected onClick(annotation: IAnnotation)
    {
        const annotations = this.controller.getActiveAnnotations();
        this.controller.actions.selectAnnotation(annotations, annotation);
    }
}