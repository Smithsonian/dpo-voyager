import { TLightType } from "client/schema/document";
import CVDirectionalLight from "./CVDirectionalLight";

export default class CVSunLight extends CVDirectionalLight {
    static readonly typeName: string = "CVSunLight";
    static readonly type: TLightType = "sun";
    static readonly text: string = "Sun";
    static readonly icon: string = "sun";
}
