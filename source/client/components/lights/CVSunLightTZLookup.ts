/**
* Funded by the Netherlands eScience Center in the context of the
* [Dynamic 3D]{@link https://research-software-directory.org/projects/dynamic3d} project.
*
* @author Carsten Schnober <c.schnober@esciencecenter.nl>
*/

import CVSunLight from "./CVSunLight";

var tzlookup = require("@photostructure/tz-lookup");

/**
 * CVSunLight sub-class that automatically resolves the timezone with tzlookup.
 * CVSunLight should be used in the Explorer bundle to avoid the extra package weight of tzlookup,
 * while CVSunLightTZLookup is used in the Story bundle to provide automatic timezone resolution based on lat/lon.
 * 
 */
export default class CVSunLightTZLookup extends CVSunLight {
    // Same as for parent class, so that it can be used as a full replacement.
    static readonly typeName: string = "CVSunLight";

    protected resolveTimezone(lat: number, lon: number): string | null {
        return tzlookup(lat, lon) as string;
    }
}
