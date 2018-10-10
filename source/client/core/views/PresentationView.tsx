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

import Canvas from "@ff/react/Canvas";
import ManipTarget from "@ff/react/ManipTarget";

import PresentationOverlay from "./PresentationOverlay";
import PresentationController from "../controllers/PresentationController";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[PresentationView]] component. */
export interface IPresentationViewProps
{
    className?: string;
    controller: PresentationController;
}

export default class PresentationView extends React.Component<IPresentationViewProps, {}>
{
    static readonly defaultProps = {
        className: "presentation-view"
    };

    render()
    {
        const {
            className,
            controller
        } = this.props;

        const {
            actions,
            system,
            handler
        } = controller;

        return (
            <ManipTarget
                className={className}
                handler={handler}>

                <Canvas
                    onCanvas={e => system.setCanvas(e.canvas)}
                    onResize={e => system.setViewportSize(e.width, e.height)} />

                <PresentationOverlay
                    actions={actions} />

            </ManipTarget>
        );
    }
}