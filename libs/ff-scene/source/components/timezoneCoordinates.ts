import { timezoneCoordinates } from "./timezoneCoordinatesData";

/** Returns the IANA representative location, not the user's actual location. */
export function getTimezoneCoordinates(timezone: string, utcOffset: number): [number, number] {
    const direct = timezoneCoordinates[timezone];
    if (direct) {
        return direct;
    }

    const canonical = new Intl.DateTimeFormat("en", { timeZone: timezone }).resolvedOptions().timeZone;
    if (canonical === "UTC") {
        return [0, 0];
    }

    const fixedOffset = /^Etc\/GMT([+-])(\d{1,2})$/.exec(canonical);
    if (fixedOffset) {
        const longitude = (fixedOffset[1] === "+" ? -1 : 1) * Number(fixedOffset[2]) * 15;
        return [0, Math.max(-180, Math.min(180, longitude))];
    }

    if (timezoneCoordinates[canonical]) {
        return timezoneCoordinates[canonical];
    }

    for (const [name, coordinates] of Object.entries(timezoneCoordinates)) {
        try {
            if (new Intl.DateTimeFormat("en", { timeZone: name }).resolvedOptions().timeZone === canonical) {
                return coordinates;
            }
        }
        catch (error) {
            // Older runtimes may not recognize every zone in the IANA data.
            if (!(error instanceof RangeError)) {
                throw error;
            }
        }
    }

    console.warn(`No representative coordinates for timezone '${timezone}'; approximating from its UTC offset.`);
    return [0, Math.max(-180, Math.min(180, utcOffset / 4))];
}
