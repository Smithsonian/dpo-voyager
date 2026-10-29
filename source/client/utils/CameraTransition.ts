/**
 * Chooses equivalent Euler angles nearest the current orbit, in degrees.
 * Keep the saved arc when wrapping would cross a navigation limit. Never wrap
 * each animation frame: that would introduce discontinuities in interpolation.
 */
export function nearestCameraOrbit(current: number[], target: number[], min: number[], max: number[]): number[]
{
    return target.map((angle, axis) => {
        let delta = (angle - current[axis]) % 360;
        if (delta > 180) { delta -= 360; }
        if (delta < -180) { delta += 360; }
        const nearest = current[axis] + delta;
        return nearest >= min[axis] && nearest <= max[axis] ? nearest : angle;
    });
}
