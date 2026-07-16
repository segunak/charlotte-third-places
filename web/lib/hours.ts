/**
 * Utilities for parsing and deriving insights from hours data.
 *
 * Hours are stored as a JSON array of strings in the canonical format:
 *   "Day: H AM/PM - H AM/PM" (on the hour) or "Day: H:MM AM/PM - H:MM AM/PM" (with minutes)
 * 
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

/** Get today's hours line from hours array. */
function getTodayLine(hours: string[], day: string): string | null {
    const line = hours.find((l) =>
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

/**
 * Parse a day's hours string into discrete open intervals (minutes since midnight).
 * Unlike getDayTimeRange, which flattens to first-open/last-close, this preserves each
 * range separately so gaps between service periods (e.g. "7 AM - 2 PM, 5 PM - 1 AM") are
 * respected rather than treated as one continuous span. Past-midnight closes are normalized
 * to > 1440 (e.g. 1 AM -> 1500) so overnight ranges can be detected by callers. Returns
 * intervals sorted by opening time; an empty array for Closed / unparseable input.
 */
function parseDayIntervals(hoursStr: string): Array<{ open: number; close: number }> {
    if (!hoursStr) return [];
    const lower = hoursStr.toLowerCase();
    if (lower === "closed") return [];
    if (lower.includes("open 24 hours")) return [{ open: 0, close: 24 * 60 }];

    const intervals: Array<{ open: number; close: number }> = [];
    for (const rangeStr of hoursStr.split(",")) {
        const range = rangeStr.trim();
        const dash = range.indexOf(" - ");
        if (dash === -1) continue;
        const open = parseTimeToMinutes(range.substring(0, dash).trim());
        let close = parseTimeToMinutes(range.substring(dash + 3).trim());
        if (open === null || close === null) continue;
        // Past-midnight close (e.g. 5 PM - 1 AM). The `< 6 AM` guard mirrors getDayTimeRange
        // so malformed same-day ranges aren't mistaken for overnight ones.
        if (close <= open && close < 6 * 60) {
            close += 24 * 60;
        }
        intervals.push({ open, close });
    }

    return intervals.sort((a, b) => a.open - b.open);
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
function findNextOpenDay(hours: string[], fromDay: string): string | null {
    const fromIdx = DAYS.indexOf(fromDay as typeof DAYS[number]);
    if (fromIdx === -1) return null;

    for (let offset = 1; offset <= 6; offset++) {
        const nextDay = DAYS[(fromIdx + offset) % 7];
        const line = getTodayLine(hours, nextDay);
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
function getHoursStatusAt(hours: string[], time: CharlotteTime): HoursStatus {
    if (!hours || hours.length === 0) return { state: "unknown" };

    const { day, totalMinutes: nowTotalMinutes } = time;

    // 1. Overnight carryover: a previous-day range may extend past midnight into today
    //    (e.g. yesterday "5 PM - 1 AM" and it is now 12:30 AM). Check this before today's
    //    line so a place that is genuinely still open reads as open, not closed.
    const dayIdx = DAYS.indexOf(day as typeof DAYS[number]);
    if (dayIdx !== -1) {
        const prevDay = DAYS[(dayIdx + 6) % 7];
        const prevLine = getTodayLine(hours, prevDay);
        if (prevLine) {
            for (const interval of parseDayIntervals(getHoursFromLine(prevLine))) {
                if (interval.close > 24 * 60) {
                    const carryCloseMinutes = interval.close - 24 * 60;
                    if (nowTotalMinutes < carryCloseMinutes) {
                        const minutesUntilClose = carryCloseMinutes - nowTotalMinutes;
                        const closesAtStr = formatMinutesToTime(carryCloseMinutes);
                        return minutesUntilClose <= OPENING_OR_CLOSING_SOON_MINUTES
                            ? { state: "closing-soon", closesAt: closesAtStr }
                            : { state: "open", closesAt: closesAtStr };
                    }
                }
            }
        }
    }

    // 2. Today's schedule.
    const todayLine = getTodayLine(hours, day);
    if (!todayLine) return { state: "unknown" };

    const hoursStr = getHoursFromLine(todayLine);
    if (hoursStr.toLowerCase() === "closed") {
        const opensAt = findNextOpenDay(hours, day);
        return { state: "closed-today", opensAt };
    }

    const intervals = parseDayIntervals(hoursStr);
    if (intervals.length === 0) return { state: "unknown" };

    // Currently within one of today's intervals? Intervals are discrete, so the gap
    // between service periods (e.g. a 2 PM - 5 PM break) correctly reads as closed.
    for (const interval of intervals) {
        if (nowTotalMinutes >= interval.open && nowTotalMinutes < interval.close) {
            const minutesUntilClose = interval.close - nowTotalMinutes;
            const closesAtStr = formatMinutesToTime(interval.close);
            return minutesUntilClose <= OPENING_OR_CLOSING_SOON_MINUTES
                ? { state: "closing-soon", closesAt: closesAtStr }
                : { state: "open", closesAt: closesAtStr };
        }
    }

    // Not open now — find the next interval that opens later today (intervals are sorted).
    for (const interval of intervals) {
        if (nowTotalMinutes < interval.open) {
            const minutesUntilOpen = interval.open - nowTotalMinutes;
            return minutesUntilOpen <= OPENING_OR_CLOSING_SOON_MINUTES
                ? { state: "opening-soon", opensAt: formatMinutesToTime(interval.open) }
                : { state: "closed", opensAt: formatMinutesToTime(interval.open) };
        }
    }

    // Past all of today's intervals — look forward to the next open day.
    const opensAt = findNextOpenDay(hours, day);
    return { state: "closed", opensAt };
}

/**
 * Determine the current hours status for a place in Charlotte's timezone.
 * Public API - creates a fresh CharlotteTime snapshot per call.
 * For batch operations, use getCharlotteTimeNow() + getHoursStatusAt() directly.
 */
export function getHoursStatus(hours: string[]): HoursStatus {
    return getHoursStatusAt(hours, getCharlotteTimeNow());
}

// ============================================================================
// OPEN LATE / OPEN EARLY - with CharlotteTime parameter
// ============================================================================

/** Extract the closing hour (24h format) for a given day from hours. */
function getClosingHour(hours: string[], day: string): number | null {
    const line = getTodayLine(hours, day);
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

/** Extract the opening hour (24h format) for a given day from hours. */
function getOpeningHour(hours: string[], day: string): number | null {
    const line = getTodayLine(hours, day);
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
function isOpenLateAt(hours: string[], day: string): boolean {
    if (!hours || hours.length === 0) return false;
    const closingHour = getClosingHour(hours, day);
    if (closingHour === null) return false;
    return closingHour >= OPEN_LATE_THRESHOLD_HOUR;
}

/** Internal: check Open Early using pre-computed day. */
function isOpenEarlyAt(hours: string[], day: string): boolean {
    if (!hours || hours.length === 0) return false;
    const openingHour = getOpeningHour(hours, day);
    if (openingHour === null) return false;
    return openingHour <= OPEN_EARLY_THRESHOLD_HOUR;
}

/** Public: Determines if a place is "Open Late" based on today's hours. */
export function isOpenLate(hours: string[]): boolean {
    return isOpenLateAt(hours, getCharlotteTimeNow().day);
}

/** Public: Determines if a place is "Open Early" (opens at 7 AM or earlier today). */
export function isOpenEarly(hours: string[]): boolean {
    return isOpenEarlyAt(hours, getCharlotteTimeNow().day);
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
export function isPlaceOpenNow(hours: string[], time: CharlotteTime): boolean {
    if (!hours || hours.length === 0) return false;
    const status = getHoursStatusAt(hours, time);
    return status.state === "open" || status.state === "closing-soon";
}

// ============================================================================
// BATCH OPERATIONS - compute timezone once, apply to all places
// ============================================================================

/**
 * Enrich a list of places by injecting dynamic tags based on hours:
 * - "Open Late" for places open until 10 PM or later today
 * - "Open Early" for places opening at 7 AM or earlier today
 *
 * PERFORMANCE: Computes Charlotte timezone ONCE (2 Intl calls total, not 4xN).
 * Designed to run client-side so tags are dynamic based on the user's visit day.
 */
export function injectDynamicTags<T extends { tags: string[]; hours: string[] }>(
    places: T[]
): T[] {
    const { day } = getCharlotteTimeNow(); // 2 Intl calls for entire batch

    return places.map((place) => {
        const tags = place.tags ?? [];
        const hours = place.hours ?? [];
        let newTags = tags;

        if (isOpenLateAt(hours, day) && !newTags.includes("Open Late")) {
            newTags = [...newTags, "Open Late"];
        }
        if (isOpenEarlyAt(hours, day) && !newTags.includes("Open Early")) {
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

export { getClosingHour, getCurrentDayInCharlotte, getDayTimeRange, getOpeningHour, OPEN_EARLY_THRESHOLD_HOUR, OPEN_LATE_THRESHOLD_HOUR, OPENING_OR_CLOSING_SOON_MINUTES, parseDayIntervals, parseHour24, parseTimeToMinutes };

// New exports for batch callers (PlaceListWithFilters Open Now, PlacePageClient)
    export { getHoursStatusAt, isOpenEarlyAt, isOpenLateAt };

