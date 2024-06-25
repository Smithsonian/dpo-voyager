/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import NTransform from "./NTransform";
import CCamera, { EProjection } from "../components/CCamera";

////////////////////////////////////////////////////////////////////////////////

export { EProjection };

export default class NCamera extends NTransform
{
    static readonly typeName: string = "NCamera";

    get camera() {
        return this.getComponent(CCamera);
    }

    createComponents()
    {
        super.createComponents();
        this.createComponent(CCamera);
    }
}