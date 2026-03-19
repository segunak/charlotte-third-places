/**
 * Utilities for parsing and deriving insights from operating hours data.
 *
 * Operating hours are stored as a JSON array of strings in the canonical format:
 *   "Day: H AM/PM - H AM/PM" (on the hour) or "Day: H:MM AM/PM - H:MM AM/PM" (with minutes)
 * Examples:
 *   "Monday: 3 PM - 8 PM"
 *   "Tuesday: 11 AM - 2 PM, 5 PM - 10 PM"
 *   "Wednesday: 7:30 AM - 5 PM"
 *   "Sunday: Closed"
 */

const CHARLOTTE_TIMEZONE = "America/New_York";

const OPEN_LATE_THRESHOLD_HOUR = 22; // 10 PM in 24-hour format
const CLOSING_SOON_MINUTES = 60; // within 1 hour of closing

/**
 * Get the current day name in Charlotte's timezone.
 */
function getCurrentDayInCharlotte(): string {
    return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: CHARLOTTE_TIMEZONE,
    }).format(new Date());
}

/**
 * Get current hours and minutes in Charlotte's timezone.
 */
function getCurrentTimeInCharlotte(): { hours: number; minutes: number } {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: false,
        timeZone: CHARLOTTE_TIMEZONE,
    });
    const parts = formatter.formatToParts(now);
    const hours = parseInt(parts.find(p => p.type === "hour")?.value ?? "0", 10);
    const minutes = parseInt(parts.find(p => p.type === "minute")?.value ?? "0", 10);
    return { hours, minutes };
}

/**
 * Parse a time string like "10 PM", "10:30 PM", "3 AM" into total minutes since midnight.
 * Returns null if parsing fails.
 */
function parseTimeToMinutes(timeStr: string): number | null {
    // Match "H AM/PM" or "H:MM AM/PM"
    const match = timeStr.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (!match) return null;

    let hour = parseInt(match[1], 10);
    const minute = match[2] ? parseInt(match[2], 10) : 0;
    const period = match[3].toUpperCase();

    if (period === "AM" && hour === 12) hour = 0;
    if (period === "PM" && hour !== 12) hour += 12;

    return hour * 60 + minute;
}

/**
 * Parse a time string into 24-hour integer (e.g., 22). For backward compat with isOpenLate.
 */
function parseHour24(timeStr: string): number | null {
    const minutes = parseTimeToMinutes(timeStr);
    if (minutes === null) return null;
    return Math.floor(minutes / 60);
}

/**
 * Get today's hours line from operating hours array.
 */
function getTodayLine(operatingHours: string[], day: string): string | null {
    const line = operatingHours.find((l) =>
        l.toLowerCase().startsWith(day.toLowerCase() + ":")
    );
    return line ?? null;
}

/**
 * Extract the hours portion after "Day: " from a line.
 */
function getHoursFromLine(line: string): string {
    return line.substring(line.indexOf(":") + 1).trim();
}

/**
 * Extract opening and closing minutes for a day's hours.
 * For multi-range, returns first open and last close.
 */
function getDayTimeRange(hoursStr: string): { openMinutes: number; closeMinutes: number } | null {
    if (!hoursStr) return null;
    const lower = hoursStr.toLowerCase();
    if (lower === "closed") return null;
    if (lower.includes("open 24 hours")) return { openMinutes: 0, closeMinutes: 24 * 60 };

    const ranges = hoursStr.split(",").map((r) => r.trim());

    // First range → open time
    const firstRange = ranges[0];
    const firstDash = firstRange.indexOf(" - ");
    if (firstDash === -1) return null;
    const openStr = firstRange.substring(0, firstDash).trim();
    const openMinutes = parseTimeToMinutes(openStr);

    // Last range → close time
    const lastRange = ranges[ranges.length - 1];
    const lastDash = lastRange.lastIndexOf(" - ");
    if (lastDash === -1) return null;
    const closeStr = lastRange.substring(lastDash + 3).trim();
    let closeMinutes = parseTimeToMinutes(closeStr);

    if (openMinutes === null || closeMinutes === null) return null;

    // Past-midnight normalization (e.g., close at 1 AM = 60 minutes, but it's after midnight)
    if (closeMinutes <= openMinutes && closeMinutes < 6 * 60) {
        closeMinutes += 24 * 60;
    }

    return { openMinutes, closeMinutes };
}

export type HoursStatus =
    | { state: "open"; closesAt: string }
    | { state: "closing-soon"; closesAt: string }
    | { state: "closed"; opensAt: string | null }
    | { state: "closed-today" }
    | { state: "unknown" };

/**
 * Determine the current hours status for a place in Charlotte's timezone.
 * Returns whether the place is Open, Closed, or Closing Soon with relevant time info.
 */
export function getHoursStatus(operatingHours: string[]): HoursStatus {
    if (!operatingHours || operatingHours.length === 0) return { state: "unknown" };

    const day = getCurrentDayInCharlotte();
    const { hours: nowHours, minutes: nowMinutes } = getCurrentTimeInCharlotte();
    const nowTotalMinutes = nowHours * 60 + nowMinutes;

    const todayLine = getTodayLine(operatingHours, day);
    if (!todayLine) return { state: "unknown" };

    const hoursStr = getHoursFromLine(todayLine);
    if (hoursStr.toLowerCase() === "closed") return { state: "closed-today" };

    const range = getDayTimeRange(hoursStr);
    if (!range) return { state: "unknown" };

    const { openMinutes, closeMinutes } = range;

    // Format a minutes-since-midnight value to display time
    const formatTime = (totalMins: number): string => {
        let m = totalMins % (24 * 60);
        const h = Math.floor(m / 60);
        const min = m % 60;
        const period = h >= 12 ? "PM" : "AM";
        const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return min === 0 ? `${displayHour} ${period}` : `${displayHour}:${String(min).padStart(2, "0")} ${period}`;
    };

    if (nowTotalMinutes < openMinutes) {
        // Before opening
        return { state: "closed", opensAt: formatTime(openMinutes) };
    }

    if (nowTotalMinutes >= closeMinutes) {
        // After closing — find tomorrow's open time
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const todayIdx = days.indexOf(day);
        const tomorrowDay = days[(todayIdx + 1) % 7];
        const tomorrowLine = getTodayLine(operatingHours, tomorrowDay);
        if (tomorrowLine) {
            const tomorrowHours = getHoursFromLine(tomorrowLine);
            if (tomorrowHours.toLowerCase() !== "closed") {
                const tomorrowRange = getDayTimeRange(tomorrowHours);
                if (tomorrowRange) {
                    const shortDay = tomorrowDay.substring(0, 3);
                    return { state: "closed", opensAt: `${formatTime(tomorrowRange.openMinutes)} ${shortDay}` };
                }
            }
        }
        return { state: "closed", opensAt: null };
    }

    // Currently within operating hours
    const minutesUntilClose = closeMinutes - nowTotalMinutes;
    const closesAtStr = formatTime(closeMinutes);

    if (minutesUntilClose <= CLOSING_SOON_MINUTES) {
        return { state: "closing-soon", closesAt: closesAtStr };
    }

    return { state: "open", closesAt: closesAtStr };
}

/**
 * Extract the closing hour (24h format) for a given day from operating hours.
 * For multi-range days, uses the last close time.
 */
function getClosingHour(operatingHours: string[], day: string): number | null {
    const line = getTodayLine(operatingHours, day);
    if (!line) return null;

    const hoursStr = getHoursFromLine(line);
    if (hoursStr.toLowerCase() === "closed") return null;
    if (hoursStr.toLowerCase().includes("open 24 hours")) return 24;

    const ranges = hoursStr.split(",").map((r) => r.trim());
    const lastRange = ranges[ranges.length - 1];
    const dashIndex = lastRange.lastIndexOf(" - ");
    if (dashIndex === -1) return null;

    const closeTimeStr = lastRange.substring(dashIndex + 3).trim();
    const hour = parseHour24(closeTimeStr);

    if (hour !== null && hour >= 0 && hour < 6) {
        return 24 + hour;
    }

    return hour;
}

/**
 * Determines if a place is "Open Late" based on its operating hours for the current day.
 */
export function isOpenLate(operatingHours: string[]): boolean {
    if (!operatingHours || operatingHours.length === 0) return false;

    const today = getCurrentDayInCharlotte();
    const closingHour = getClosingHour(operatingHours, today);

    if (closingHour === null) return false;
    return closingHour >= OPEN_LATE_THRESHOLD_HOUR;
}

/**
 * Enrich a list of places by injecting the "Open Late" tag.
 */
export function injectOpenLateTags<T extends { tags: string[]; operatingHours: string[] }>(
    places: T[]
): T[] {
    return places.map((place) => {
        if (isOpenLate(place.operatingHours) && !place.tags.includes("Open Late")) {
            return { ...place, tags: [...place.tags, "Open Late"] };
        }
        return place;
    });
}

// Exported for testing
export { parseHour24, parseTimeToMinutes, getClosingHour, getCurrentDayInCharlotte, getDayTimeRange, OPEN_LATE_THRESHOLD_HOUR, CLOSING_SOON_MINUTES };
