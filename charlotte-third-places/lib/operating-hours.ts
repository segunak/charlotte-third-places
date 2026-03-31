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
 *
 * PERFORMANCE: All timezone-aware date/time lookups are centralized in getCharlotteTimeNow().
 * Batch operations (injectDynamicTags, isPlaceOpenNow) call it once and pass the snapshot
 * to internal *At() variants, avoiding repeated Intl.DateTimeFormat instantiation.
 */

const CHARLOTTE_TIMEZONE = "America/New_York";

const OPEN_LATE_THRESHOLD_HOUR = 22; // 10 PM in 24-hour format
const OPEN_EARLY_THRESHOLD_HOUR = 7; // 7 AM in 24-hour format
const OPENING_OR_CLOSING_SOON_MINUTES = 60; // within 1 hour of opening or closing

// ============================================================================
// CHARLOTTE TIME SNAPSHOT - compute timezone once, reuse everywhere
// ============================================================================

/**
 * A point-in-time snapshot of the current day and time in Charlotte's timezone.
 * Created once per operation and passed to all internal functions to avoid
 * repeated Intl.DateTimeFormat instantiation (~300 instances -> 2).
 */
export interface CharlotteTime {
    day: string;           // "Monday", "Tuesday", etc.
    totalMinutes: number;  // minutes since midnight (e.g., 14:30 = 870)
}

/**
 * Get the current day and time in Charlotte's timezone.
 * This is the ONLY function that creates Intl.DateTimeFormat instances.
 * All other functions accept a CharlotteTime snapshot.
 */
export function getCharlotteTimeNow(): CharlotteTime {
    const now = new Date();

    const day = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: CHARLOTTE_TIMEZONE,
    }).format(now);

    const timeParts = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: false,
        timeZone: CHARLOTTE_TIMEZONE,
    }).formatToParts(now);

    const hours = parseInt(timeParts.find(p => p.type === "hour")?.value ?? "0", 10);
    const minutes = parseInt(timeParts.find(p => p.type === "minute")?.value ?? "0", 10);

    return { day, totalMinutes: hours * 60 + minutes };
}

// Legacy wrappers - used only by the exports at the bottom for backward compat in tests
function getCurrentDayInCharlotte(): string {
    return getCharlotteTimeNow().day;
}

function getCurrentTimeInCharlotte(): { hours: number; minutes: number } {
    const { totalMinutes } = getCharlotteTimeNow();
    return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

// ============================================================================
// PARSING UTILITIES - pure functions, no Intl calls
// ============================================================================

/**
 * Parse a time string like "10 PM", "10:30 PM", "3 AM" into total minutes since midnight.
 * Returns null if parsing fails.
 */
function parseTimeToMinutes(timeStr: string): number | null {
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

/** Get today's hours line from operating hours array. */
function getTodayLine(operatingHours: string[], day: string): string | null {
    const line = operatingHours.find((l) =>
        l.toLowerCase().startsWith(day.toLowerCase() + ":")
    );
    return line ?? null;
}

/** Extract the hours portion after "Day: " from a line. */
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

    const firstRange = ranges[0];
    const firstDash = firstRange.indexOf(" - ");
    if (firstDash === -1) return null;
    const openStr = firstRange.substring(0, firstDash).trim();
    const openMinutes = parseTimeToMinutes(openStr);

    const lastRange = ranges[ranges.length - 1];
    const lastDash = lastRange.lastIndexOf(" - ");
    if (lastDash === -1) return null;
    const closeStr = lastRange.substring(lastDash + 3).trim();
    let closeMinutes = parseTimeToMinutes(closeStr);

    if (openMinutes === null || closeMinutes === null) return null;

    if (closeMinutes <= openMinutes && closeMinutes < 6 * 60) {
        closeMinutes += 24 * 60;
    }

    return { openMinutes, closeMinutes };
}

/** Format a minutes-since-midnight value to display time like "7 AM" or "9:30 PM". */
function formatMinutesToTime(totalMins: number): string {
    const m = totalMins % (24 * 60);
    const h = Math.floor(m / 60);
    const min = m % 60;
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return min === 0 ? `${displayHour} ${period}` : `${displayHour}:${String(min).padStart(2, "0")} ${period}`;
}

// ============================================================================
// HOURS STATUS - core logic with CharlotteTime parameter
// ============================================================================

export type HoursStatus =
    | { state: "open"; closesAt: string }
    | { state: "closing-soon"; closesAt: string }
    | { state: "opening-soon"; opensAt: string }
    | { state: "closed"; opensAt: string | null }
    | { state: "closed-today"; opensAt: string | null }
    | { state: "unknown" };

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/**
 * Search up to 6 days forward from a given day to find the next open day.
 * Returns a formatted string like "7 AM" (if tomorrow) or "Mon 7 AM" (if 2+ days out),
 * or null if no open day found. Day-first format ensures the most critical info (which day)
 * survives truncation in the UI badge.
 */
function findNextOpenDay(operatingHours: string[], fromDay: string): string | null {
    const fromIdx = DAYS.indexOf(fromDay as typeof DAYS[number]);
    if (fromIdx === -1) return null;

    for (let offset = 1; offset <= 6; offset++) {
        const nextDay = DAYS[(fromIdx + offset) % 7];
        const line = getTodayLine(operatingHours, nextDay);
        if (!line) continue;
        const hoursStr = getHoursFromLine(line);
        if (hoursStr.toLowerCase() === "closed") continue;
        const range = getDayTimeRange(hoursStr);
        if (range) {
            const time = formatMinutesToTime(range.openMinutes);
            // Tomorrow: just the time. 2+ days out: day first so it survives truncation.
            return offset === 1 ? time : `${nextDay.substring(0, 3)} ${time}`;
        }
    }
    return null;
}

/**
 * Internal: Determine hours status using a pre-computed CharlotteTime snapshot.
 * No Intl calls - pure string parsing and math.
 */
function getHoursStatusAt(operatingHours: string[], time: CharlotteTime): HoursStatus {
    if (!operatingHours || operatingHours.length === 0) return { state: "unknown" };

    const { day, totalMinutes: nowTotalMinutes } = time;

    const todayLine = getTodayLine(operatingHours, day);
    if (!todayLine) return { state: "unknown" };

    const hoursStr = getHoursFromLine(todayLine);
    if (hoursStr.toLowerCase() === "closed") {
        const opensAt = findNextOpenDay(operatingHours, day);
        return { state: "closed-today", opensAt };
    }

    const range = getDayTimeRange(hoursStr);
    if (!range) return { state: "unknown" };

    const { openMinutes, closeMinutes } = range;

    if (nowTotalMinutes < openMinutes) {
        const minutesUntilOpen = openMinutes - nowTotalMinutes;
        if (minutesUntilOpen <= OPENING_OR_CLOSING_SOON_MINUTES) {
            return { state: "opening-soon", opensAt: formatMinutesToTime(openMinutes) };
        }
        return { state: "closed", opensAt: formatMinutesToTime(openMinutes) };
    }

    if (nowTotalMinutes >= closeMinutes) {
        const opensAt = findNextOpenDay(operatingHours, day);
        return { state: "closed", opensAt };
    }

    const minutesUntilClose = closeMinutes - nowTotalMinutes;
    const closesAtStr = formatMinutesToTime(closeMinutes);

    if (minutesUntilClose <= OPENING_OR_CLOSING_SOON_MINUTES) {
        return { state: "closing-soon", closesAt: closesAtStr };
    }

    return { state: "open", closesAt: closesAtStr };
}

/**
 * Determine the current hours status for a place in Charlotte's timezone.
 * Public API - creates a fresh CharlotteTime snapshot per call.
 * For batch operations, use getCharlotteTimeNow() + getHoursStatusAt() directly.
 */
export function getHoursStatus(operatingHours: string[]): HoursStatus {
    return getHoursStatusAt(operatingHours, getCharlotteTimeNow());
}

// ============================================================================
// OPEN LATE / OPEN EARLY - with CharlotteTime parameter
// ============================================================================

/** Extract the closing hour (24h format) for a given day from operating hours. */
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

/** Extract the opening hour (24h format) for a given day from operating hours. */
function getOpeningHour(operatingHours: string[], day: string): number | null {
    const line = getTodayLine(operatingHours, day);
    if (!line) return null;

    const hoursStr = getHoursFromLine(line);
    if (hoursStr.toLowerCase() === "closed") return null;
    if (hoursStr.toLowerCase().includes("open 24 hours")) return 0;

    const ranges = hoursStr.split(",").map((r) => r.trim());
    const firstRange = ranges[0];
    const dashIndex = firstRange.indexOf(" - ");
    if (dashIndex === -1) return null;

    const openTimeStr = firstRange.substring(0, dashIndex).trim();
    return parseHour24(openTimeStr);
}

/** Internal: check Open Late using pre-computed day. */
function isOpenLateAt(operatingHours: string[], day: string): boolean {
    if (!operatingHours || operatingHours.length === 0) return false;
    const closingHour = getClosingHour(operatingHours, day);
    if (closingHour === null) return false;
    return closingHour >= OPEN_LATE_THRESHOLD_HOUR;
}

/** Internal: check Open Early using pre-computed day. */
function isOpenEarlyAt(operatingHours: string[], day: string): boolean {
    if (!operatingHours || operatingHours.length === 0) return false;
    const openingHour = getOpeningHour(operatingHours, day);
    if (openingHour === null) return false;
    return openingHour <= OPEN_EARLY_THRESHOLD_HOUR;
}

/** Public: Determines if a place is "Open Late" based on today's hours. */
export function isOpenLate(operatingHours: string[]): boolean {
    return isOpenLateAt(operatingHours, getCharlotteTimeNow().day);
}

/** Public: Determines if a place is "Open Early" (opens at 7 AM or earlier today). */
export function isOpenEarly(operatingHours: string[]): boolean {
    return isOpenEarlyAt(operatingHours, getCharlotteTimeNow().day);
}

// ============================================================================
// OPEN NOW - lightweight check for filtering
// ============================================================================

/**
 * Check if a place is currently open using a pre-computed CharlotteTime snapshot.
 * Returns true only for places that are actually open right now (open or closing-soon).
 * "Opening soon" places are NOT considered open, they haven't opened yet.
 *
 * Designed for batch filtering (e.g., "Open Now" button) where you compute
 * the time once and check all places against it - no Intl calls per place.
 */
export function isPlaceOpenNow(operatingHours: string[], time: CharlotteTime): boolean {
    if (!operatingHours || operatingHours.length === 0) return false;
    const status = getHoursStatusAt(operatingHours, time);
    return status.state === "open" || status.state === "closing-soon";
}

// ============================================================================
// BATCH OPERATIONS - compute timezone once, apply to all places
// ============================================================================

/**
 * Enrich a list of places by injecting dynamic tags based on operating hours:
 * - "Open Late" for places open until 10 PM or later today
 * - "Open Early" for places opening at 7 AM or earlier today
 *
 * PERFORMANCE: Computes Charlotte timezone ONCE (2 Intl calls total, not 4xN).
 * Designed to run client-side so tags are dynamic based on the user's visit day.
 */
export function injectDynamicTags<T extends { tags: string[]; operatingHours: string[] }>(
    places: T[]
): T[] {
    const { day } = getCharlotteTimeNow(); // 2 Intl calls for entire batch

    return places.map((place) => {
        const tags = place.tags ?? [];
        const operatingHours = place.operatingHours ?? [];
        let newTags = tags;

        if (isOpenLateAt(operatingHours, day) && !newTags.includes("Open Late")) {
            newTags = [...newTags, "Open Late"];
        }
        if (isOpenEarlyAt(operatingHours, day) && !newTags.includes("Open Early")) {
            newTags = [...newTags, "Open Early"];
        }

        return newTags !== tags ? { ...place, tags: newTags } : place;
    });
}

/**
 * @deprecated Use injectDynamicTags instead
 */
export const injectOpenLateTags = injectDynamicTags;

// ============================================================================
// EXPORTS - backward compatible
// ============================================================================

export { parseHour24, parseTimeToMinutes, getClosingHour, getOpeningHour, getCurrentDayInCharlotte, getDayTimeRange, OPEN_LATE_THRESHOLD_HOUR, OPEN_EARLY_THRESHOLD_HOUR, OPENING_OR_CLOSING_SOON_MINUTES };

// New exports for batch callers (PlaceListWithFilters Open Now, PlacePageClient)
export { getHoursStatusAt, isOpenLateAt, isOpenEarlyAt };
