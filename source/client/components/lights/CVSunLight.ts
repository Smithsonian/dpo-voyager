/**
* Funded by the Netherlands eScience Center in the context of the
* [Dynamic 3D]{@link https://research-software-directory.org/projects/dynamic3d} project
* and the "Paradata in 3D Scholarship" workshop {@link https://research-software-directory.org/projects/paradata-in-3d-scholarship}
*
* @author c.schnober@esciencecenter.nl
*/

import CSunLight from "@ff/scene/components/CSunLight";
import { IDocument, INode, TLightType } from "../../schema/document";
import { ICVLight } from "./CVLight";

export default class CVSunLight extends CSunLight implements ICVLight {
    static readonly typeName: string = "CVSunLight";
    static readonly type: TLightType = "sun";
    static readonly text: string = "Sun";
    static readonly icon: string = "sun";

    get snapshotProperties() {
        return [
            this.ins.color,
            this.ins.intensity,
            this.ins.date,
            this.ins.time,
            this.ins.location
        ];
    }

    fromDocument(document: IDocument, node: INode): void {
        throw new Error("Method not implemented.");
    }
    toDocument(document: IDocument, node: INode): number {
        throw new Error("Method not implemented.");
    }
}
