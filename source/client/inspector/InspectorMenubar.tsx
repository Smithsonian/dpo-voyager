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

import FlexSpacer from "@ff/react/FlexSpacer";
import Badge from "@ff/react/Badge";

import { IInspectorSceneInfo } from "./InspectorScene";

////////////////////////////////////////////////////////////////////////////////

const Logo = function() {
    return(
        <div className="sv-logo" />
    );
};

interface SceneInfoProps
{
    info: IInspectorSceneInfo;
}

const SceneInfo: React.SFC<SceneInfoProps> = function(props)
{
    const info = props.info;

    if (info === null) {
        return null;
    }

    const MeshNumVertices = info.meshNumVertices > 0 ?
        <Badge color="#283593" text={ `${info.meshNumVertices} Vertices` } /> : null;

    const MeshNumFaces = info.meshNumFaces > 0 ?
        <Badge color="#01579B" text={ `${info.meshNumFaces} Faces` } /> : null;

    const MeshHasNormals = info.meshHasNormals ?
        <Badge color="#2E7D32" text="Has Normals" /> : null;

    const MeshHasUVs = info.meshHasUVs ?
        <Badge color="#827717" text="Has UVs" /> : null;

    const DiffuseMap = info.diffuseMapSize > 0 ?
        <Badge color="#6D4C41" text={ `Diffuse Map ${info.diffuseMapSize}px` } /> : null;

    const OcclusionMap = info.occlusionMapSize > 0 ?
        <Badge color="#455A64" text={ `Occlusion Map ${info.occlusionMapSize}px` } /> : null;

    const NormalMap = info.normalMapSize > 0 ?
        <Badge color="#2E7D32" text={ `Normal Map ${info.normalMapSize}px` } /> : null;


    const MeshHeader = MeshNumVertices || MeshNumFaces ?
        <span>Mesh:&nbsp;</span> : null;

    const TextureHeader = DiffuseMap || OcclusionMap || NormalMap ?
        <span>&nbsp;&nbsp;Textures:&nbsp;</span> : null;

    return(<span className="sv-scene-info">
        {MeshHeader}
        {MeshNumVertices}
        {MeshNumFaces}
        {MeshHasNormals}
        {MeshHasUVs}
        {TextureHeader}
        {DiffuseMap}
        {OcclusionMap}
        {NormalMap}
    </span>);
};

export interface InspectorMenubarProps
{
    className?: string;
    style?: CSSProperties;
    sceneInfo?: IInspectorSceneInfo;
}

export default class InspectorMenubar extends React.Component<InspectorMenubarProps, any>
{
    static defaultProps: InspectorMenubarProps = {
        className: "sv-inspector-menubar"
    };

    constructor(props: InspectorMenubarProps)
    {
        super(props);
    }

    render()
    {
        const {
            className,
            style,
            sceneInfo
        } = this.props;

        return (<div
            className={className}
            style={style}>

            <Logo />
            <SceneInfo info={sceneInfo} />
            <FlexSpacer/>
        </div>);
    }
}