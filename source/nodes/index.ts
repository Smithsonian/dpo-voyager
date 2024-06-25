/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import NCamera from "./NCamera";
import NDirectionalLight from "./NDirectionalLight";
import NPointLight from "./NPointLight";
import NScene from "./NScene";
import NSpotLight from "./NSpotLight";
import NTransform from "./NTransform";

////////////////////////////////////////////////////////////////////////////////

export {
    NCamera,
    NDirectionalLight,
    NPointLight,
    NScene,
    NSpotLight,
    NTransform
};

export const nodeTypes = [
    NCamera,
    NDirectionalLight,
    NPointLight,
    NScene,
    NSpotLight,
    NTransform
];