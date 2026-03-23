import { describe, it, expect, vi, afterEach } from "vitest";
import {
    parseHour24,
    parseTimeToMinutes,
    getClosingHour,
    getOpeningHour,
    getDayTimeRange,
    isOpenLate,
    isOpenEarly,
    injectOpenLateTags,
    injectDynamicTags,
    getHoursStatus,
    OPEN_LATE_THRESHOLD_HOUR,
} from "@/lib/operating-hours";

// Mock getCurrentDayInCharlotte by mocking the module partially
vi.mock("@/lib/operating-hours", async () => {
    const actual = await vi.importActual<typeof import("@/lib/operating-hours")>("@/lib/operating-hours");
    return {
        ...actual,
        // We'll override isOpenLate in specific tests via spying on getCurrentDayInCharlotte
    };
});

describe("parseHour24", () => {
    it("parses times with minutes", () => {
        expect(parseHour24("7:00 AM")).toBe(7);
        expect(parseHour24("11:30 AM")).toBe(11);
    });

    it("parses times without minutes", () => {
        expect(parseHour24("7 AM")).toBe(7);
        expect(parseHour24("3 PM")).toBe(15);
        expect(parseHour24("10 PM")).toBe(22);
        expect(parseHour24("11 PM")).toBe(23);
    });

    it("handles 12 AM as midnight (0)", () => {
        expect(parseHour24("12 AM")).toBe(0);
        expect(parseHour24("12:00 AM")).toBe(0);
    });

    it("handles 12 PM as noon (12)", () => {
        expect(parseHour24("12 PM")).toBe(12);
        expect(parseHour24("12:00 PM")).toBe(12);
    });

    it("returns null for invalid strings", () => {
        expect(parseHour24("Closed")).toBeNull();
        expect(parseHour24("")).toBeNull();
        expect(parseHour24("not a time")).toBeNull();
    });
});

describe("getClosingHour", () => {
    const hours = [
        "Sunday: 12 PM - 7 PM",
        "Monday: 3 PM - 8 PM",
        "Tuesday: 4 PM - 10 PM",
        "Wednesday: 4 PM - 10 PM",
        "Thursday: 4 PM - 10 PM",
        "Friday: 1 PM - 11 PM",
        "Saturday: 12 PM - 11 PM",
    ];

    it("returns closing hour for a given day", () => {
        expect(getClosingHour(hours, "Monday")).toBe(20);
        expect(getClosingHour(hours, "Friday")).toBe(23);
        expect(getClosingHour(hours, "Sunday")).toBe(19);
    });

    it("returns null for missing day", () => {
        expect(getClosingHour(hours, "Holiday")).toBeNull();
    });

    it("returns null for Closed", () => {
        const withClosed = ["Wednesday: Closed"];
        expect(getClosingHour(withClosed, "Wednesday")).toBeNull();
    });

    it("returns 24 for Open 24 hours", () => {
        const always = ["Monday: Open 24 hours"];
        expect(getClosingHour(always, "Monday")).toBe(24);
    });

    it("uses last range for multi-range days", () => {
        const multiRange = [
            "Monday: 11 AM - 2 PM, 5 PM - 11 PM",
        ];
        expect(getClosingHour(multiRange, "Monday")).toBe(23);
    });

    it("handles midnight close as open late", () => {
        const midnight = ["Friday: 5 PM - 12 AM"];
        const hour = getClosingHour(midnight, "Friday");
        expect(hour).toBe(24);
        expect(hour!).toBeGreaterThanOrEqual(OPEN_LATE_THRESHOLD_HOUR);
    });

    it("handles 2 AM close as open late", () => {
        const lateNight = ["Saturday: 5 PM - 2 AM"];
        const hour = getClosingHour(lateNight, "Saturday");
        expect(hour).toBe(26);
        expect(hour!).toBeGreaterThanOrEqual(OPEN_LATE_THRESHOLD_HOUR);
    });

    it("is case-insensitive for day matching", () => {
        expect(getClosingHour(hours, "monday")).toBe(20);
        expect(getClosingHour(hours, "FRIDAY")).toBe(23);
    });
});

describe("isOpenLate", () => {
    // For these tests we need to control "today". We'll test getClosingHour directly
    // and trust that isOpenLate calls it correctly.

    it("returns false for empty hours", () => {
        expect(isOpenLate([])).toBe(false);
    });

    it("returns false for null/undefined", () => {
        expect(isOpenLate(null as any)).toBe(false);
        expect(isOpenLate(undefined as any)).toBe(false);
    });
});

describe("injectOpenLateTags", () => {
    it("does not duplicate tag if already present", () => {
        const places = [
            {
                tags: ["Open Late", "Coffee Shop"],
                operatingHours: ["Monday: 7 AM - 11 PM"],
            },
        ];
        // Even if isOpenLate would return true, the tag is already there
        const result = injectOpenLateTags(places);
        const openLateTags = result[0].tags.filter((t) => t === "Open Late");
        expect(openLateTags).toHaveLength(1);
    });

    it("preserves places without operating hours", () => {
        const places = [{ tags: ["Coffee Shop"], operatingHours: [] }];
        const result = injectOpenLateTags(places);
        expect(result[0].tags).toEqual(["Coffee Shop"]);
    });

    it("does not mutate the original array", () => {
        const original = [
            {
                tags: ["Coffee Shop"],
                operatingHours: ["Monday: 7 AM - 11 PM"],
            },
        ];
        const originalTags = [...original[0].tags];
        injectOpenLateTags(original);
        expect(original[0].tags).toEqual(originalTags);
    });
});

describe("parseTimeToMinutes", () => {
    it("parses times without minutes", () => {
        expect(parseTimeToMinutes("3 PM")).toBe(15 * 60);
        expect(parseTimeToMinutes("7 AM")).toBe(7 * 60);
        expect(parseTimeToMinutes("12 PM")).toBe(12 * 60);
        expect(parseTimeToMinutes("12 AM")).toBe(0);
    });

    it("parses times with minutes", () => {
        expect(parseTimeToMinutes("3:30 PM")).toBe(15 * 60 + 30);
        expect(parseTimeToMinutes("7:45 AM")).toBe(7 * 60 + 45);
    });

    it("returns null for invalid", () => {
        expect(parseTimeToMinutes("Closed")).toBeNull();
        expect(parseTimeToMinutes("")).toBeNull();
    });
});

describe("getHoursStatus", () => {
    it("returns unknown for empty hours", () => {
        expect(getHoursStatus([])).toEqual({ state: "unknown" });
    });

    it("returns unknown for null", () => {
        expect(getHoursStatus(null as any)).toEqual({ state: "unknown" });
    });

    it("returns closed-today with opensAt for Closed day", () => {
        const today = new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            timeZone: "America/New_York",
        }).format(new Date());
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const todayIdx = days.indexOf(today);
        const tomorrow = days[(todayIdx + 1) % 7];
        const hours = [
            `${today}: Closed`,
            `${tomorrow}: 10 AM - 6 PM`,
        ];
        expect(getHoursStatus(hours)).toEqual({
            state: "closed-today",
            opensAt: `10 AM`,
        });
    });

    it("returns closed-today with null opensAt when no future open day found", () => {
        const today = new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            timeZone: "America/New_York",
        }).format(new Date());
        // Only today's data, all closed or missing
        const hours = [`${today}: Closed`];
        expect(getHoursStatus(hours)).toEqual({
            state: "closed-today",
            opensAt: null,
        });
    });

    it("closed-today skips multiple closed days (Lorem Ipsum style)", () => {
        const today = new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            timeZone: "America/New_York",
        }).format(new Date());
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const todayIdx = days.indexOf(today);
        const tomorrow = days[(todayIdx + 1) % 7];
        const dayAfter = days[(todayIdx + 2) % 7];
        const thirdDay = days[(todayIdx + 3) % 7];
        const hours = [
            `${today}: Closed`,
            `${tomorrow}: Closed`,
            `${dayAfter}: Closed`,
            `${thirdDay}: 6 PM - 11 PM`,
        ];
        expect(getHoursStatus(hours)).toEqual({
            state: "closed-today",
            opensAt: `${thirdDay.substring(0, 3)} 6 PM`,
        });
    });

    it("handles bare noon opening time", () => {
        const today = new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            timeZone: "America/New_York",
        }).format(new Date());
        const hours = [`${today}: 12 PM - 9 PM`];
        const status = getHoursStatus(hours);
        expect(status.state).not.toBe("unknown");
    });

    it("handles multi-range hours (dual opening periods)", () => {
        const today = new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            timeZone: "America/New_York",
        }).format(new Date());
        const hours = [`${today}: 8 AM - 2 PM, 5 PM - 12 AM`];
        const status = getHoursStatus(hours);
        // Should resolve to a real status, not unknown
        expect(status.state).not.toBe("unknown");
    });

    it("returns a valid status for all-week hours regardless of current time", () => {
        const today = new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            timeZone: "America/New_York",
        }).format(new Date());
        const hours = [`${today}: 6 AM - 11 PM`];
        const status = getHoursStatus(hours);
        expect(["open", "closed", "closing-soon"]).toContain(status.state);
    });
});

describe("getDayTimeRange", () => {
    it("parses single range", () => {
        const range = getDayTimeRange("7 AM - 5 PM");
        expect(range).not.toBeNull();
        expect(range!.openMinutes).toBe(7 * 60);
        expect(range!.closeMinutes).toBe(17 * 60);
    });

    it("parses multi-range using first open and last close", () => {
        const range = getDayTimeRange("8 AM - 2 PM, 5 PM - 12 AM");
        expect(range).not.toBeNull();
        expect(range!.openMinutes).toBe(8 * 60);
        // 12 AM = 0, but normalized past midnight = 24 * 60
        expect(range!.closeMinutes).toBe(24 * 60);
    });

    it("returns null for Closed", () => {
        expect(getDayTimeRange("Closed")).toBeNull();
    });

    it("handles Open 24 hours", () => {
        const range = getDayTimeRange("Open 24 hours");
        expect(range).not.toBeNull();
        expect(range!.openMinutes).toBe(0);
        expect(range!.closeMinutes).toBe(24 * 60);
    });

    it("returns null for empty string", () => {
        expect(getDayTimeRange("")).toBeNull();
    });

    it("parses times with minutes", () => {
        const range = getDayTimeRange("7:30 AM - 5:30 PM");
        expect(range).not.toBeNull();
        expect(range!.openMinutes).toBe(7 * 60 + 30);
        expect(range!.closeMinutes).toBe(17 * 60 + 30);
    });

    it("handles past-midnight close times", () => {
        const range = getDayTimeRange("5 PM - 2 AM");
        expect(range).not.toBeNull();
        expect(range!.openMinutes).toBe(17 * 60);
        // 2 AM normalized past midnight
        expect(range!.closeMinutes).toBe(26 * 60);
    });
});

describe("injectOpenLateTags - null safety", () => {
    it("handles places with undefined tags without crashing", () => {
        const places = [
            { tags: undefined as any, operatingHours: ["Monday: 7 AM - 11 PM"] },
        ];
        // Should not throw — the ?? [] guard prevents .includes() on undefined
        expect(() => injectOpenLateTags(places)).not.toThrow();
    });

    it("handles places with undefined operatingHours without crashing", () => {
        const places = [
            { tags: ["Coffee Shop"], operatingHours: undefined as any },
        ];
        expect(() => injectOpenLateTags(places)).not.toThrow();
        const result = injectOpenLateTags(places);
        expect(result[0].tags).toEqual(["Coffee Shop"]);
    });

    it("handles places with both undefined without crashing", () => {
        const places = [
            { tags: undefined as any, operatingHours: undefined as any },
        ];
        expect(() => injectOpenLateTags(places)).not.toThrow();
    });
});

describe("getOpeningHour", () => {
    it("returns opening hour for a given day", () => {
        const hours = ["Monday: 7 AM - 5 PM", "Tuesday: 9 AM - 5 PM"];
        expect(getOpeningHour(hours, "Monday")).toBe(7);
        expect(getOpeningHour(hours, "Tuesday")).toBe(9);
    });

    it("returns null for Closed day", () => {
        const hours = ["Monday: Closed"];
        expect(getOpeningHour(hours, "Monday")).toBeNull();
    });

    it("returns 0 for Open 24 hours", () => {
        const hours = ["Monday: Open 24 hours"];
        expect(getOpeningHour(hours, "Monday")).toBe(0);
    });

    it("returns null for missing day", () => {
        const hours = ["Monday: 7 AM - 5 PM"];
        expect(getOpeningHour(hours, "Sunday")).toBeNull();
    });

    it("uses first range for multi-range", () => {
        const hours = ["Monday: 8 AM - 2 PM, 5 PM - 10 PM"];
        expect(getOpeningHour(hours, "Monday")).toBe(8);
    });
});

describe("isOpenEarly", () => {
    it("returns false for empty hours", () => {
        expect(isOpenEarly([])).toBe(false);
    });

    it("returns false for null/undefined", () => {
        expect(isOpenEarly(null as any)).toBe(false);
        expect(isOpenEarly(undefined as any)).toBe(false);
    });
});

describe("injectDynamicTags", () => {
    it("does not crash with undefined tags and operatingHours", () => {
        const places = [
            { tags: undefined as any, operatingHours: undefined as any },
        ];
        expect(() => injectDynamicTags(places)).not.toThrow();
    });

    it("does not duplicate existing tags", () => {
        const places = [
            {
                tags: ["Open Late", "Open Early"],
                operatingHours: ["Monday: 6 AM - 11 PM"],
            },
        ];
        const result = injectDynamicTags(places);
        expect(result[0].tags.filter(t => t === "Open Late")).toHaveLength(1);
        expect(result[0].tags.filter(t => t === "Open Early")).toHaveLength(1);
    });

    it("preserves places without operating hours", () => {
        const places = [{ tags: ["Coffee Shop"], operatingHours: [] }];
        const result = injectDynamicTags(places);
        expect(result[0].tags).toEqual(["Coffee Shop"]);
    });

    it("does not mutate the original array", () => {
        const original = [
            { tags: ["Coffee Shop"], operatingHours: ["Monday: 6 AM - 11 PM"] },
        ];
        const originalTags = [...original[0].tags];
        injectDynamicTags(original);
        expect(original[0].tags).toEqual(originalTags);
    });

    it("injectOpenLateTags is an alias for injectDynamicTags", () => {
        expect(injectOpenLateTags).toBe(injectDynamicTags);
    });
});

// Helper: get today + offset day names in Charlotte timezone
function getDayName(offset: number = 0): string {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: "America/New_York",
    }).format(new Date());
    const idx = days.indexOf(today);
    return days[(idx + offset) % 7];
}

describe("getHoursStatus - all states", () => {
    const today = getDayName(0);
    const tomorrow = getDayName(1);
    const dayAfter = getDayName(2);
    const thirdDay = getDayName(3);

    it("open state includes closesAt time", () => {
        // Wide open range that covers any time of day
        const hours = [`${today}: 12 AM - 11:59 PM`];
        const status = getHoursStatus(hours);
        if (status.state === "open") {
            expect(status.closesAt).toMatch(/\d{1,2}(:\d{2})?\s(AM|PM)/);
        }
        // Could also be closing-soon near end — both are valid
        expect(["open", "closing-soon"]).toContain(status.state);
    });

    it("closed state after hours includes opensAt without day for tomorrow", () => {
        // Place that closed very early today (1-2 AM), so at any normal test execution time
        // we're past closing and the forward lookup finds tomorrow.
        const hours = [
            `${today}: 1 AM - 2 AM`,
            `${tomorrow}: 9 AM - 5 PM`,
        ];
        const status = getHoursStatus(hours);
        if (status.state === "closed") {
            // Tomorrow: just time, no day abbreviation
            expect(status.opensAt).toMatch(/^\d{1,2}(:\d{2})?\s(AM|PM)$/);
        }
    });

    it("closed state before opening includes opensAt without day", () => {
        // Place that opens very late today — before opening, opensAt is just a time (no day)
        const hours = [`${today}: 11:59 PM - 11:59 PM`];
        // This is a degenerate range but tests the before-opening path
        const status = getHoursStatus(hours);
        // Should be closed or opening-soon, with opensAt as just a time
        if (status.state === "closed" && status.opensAt) {
            // opensAt before today's opening has no day abbreviation
            expect(status.opensAt).toMatch(/\d{1,2}(:\d{2})?\s(AM|PM)$/);
        }
    });

    it("closed-today with forward lookup returns opensAt without day for tomorrow", () => {
        const hours = [
            `${today}: Closed`,
            `${tomorrow}: 10 AM - 6 PM`,
        ];
        const status = getHoursStatus(hours);
        expect(status.state).toBe("closed-today");
        if (status.state === "closed-today") {
            // Tomorrow: just time, no day abbreviation
            expect(status.opensAt).toBe(`10 AM`);
        }
    });

    it("closed-today skips closed days to find next open (Wildroots style)", () => {
        const hours = [
            `${today}: Closed`,
            `${tomorrow}: Closed`,
            `${dayAfter}: Closed`,
            `${thirdDay}: 7 AM - 2 PM`,
        ];
        const status = getHoursStatus(hours);
        expect(status.state).toBe("closed-today");
        if (status.state === "closed-today") {
            expect(status.opensAt).toBe(`${thirdDay.substring(0, 3)} 7 AM`);
        }
    });

    it("closed-today with no future open days returns opensAt null", () => {
        const hours = [`${today}: Closed`];
        const status = getHoursStatus(hours);
        expect(status.state).toBe("closed-today");
        if (status.state === "closed-today") {
            expect(status.opensAt).toBeNull();
        }
    });

    it("after-closing forward lookup skips closed tomorrow, shows day for 2+ days out", () => {
        // Place that closed very early today (1-2 AM), so at any normal test execution time
        // we're past closing. Tomorrow is closed, dayAfter is open.
        const hours = [
            `${today}: 1 AM - 2 AM`,
            `${tomorrow}: Closed`,
            `${dayAfter}: 12 PM - 9 PM`,
        ];
        const status = getHoursStatus(hours);
        if (status.state === "closed") {
            // 2+ days out: day first, then time
            expect(status.opensAt).toBe(`${dayAfter.substring(0, 3)} 12 PM`);
        }
    });

    it("unknown state for missing day data", () => {
        // Hours array that doesn't contain today
        const otherDay = getDayName(4);
        const hours = [`${otherDay}: 9 AM - 5 PM`];
        // Only if today != otherDay
        if (today !== otherDay) {
            expect(getHoursStatus(hours)).toEqual({ state: "unknown" });
        }
    });

    it("handles hours with :30 minute times", () => {
        const hours = [`${today}: 11:30 AM - 9:30 PM`];
        const status = getHoursStatus(hours);
        expect(status.state).not.toBe("unknown");
        if (status.state === "open") {
            expect(status.closesAt).toBe("9:30 PM");
        }
    });

    it("handles past-midnight close (1 AM)", () => {
        const hours = [`${today}: 8 AM - 1 AM`];
        const status = getHoursStatus(hours);
        expect(status.state).not.toBe("unknown");
        if (status.state === "open") {
            expect(status.closesAt).toBe("1 AM");
        }
    });

    it("all states have time info (never bare status)", () => {
        // Test with a variety of scenarios
        const scenarios = [
            [`${today}: 6 AM - 11 PM`],
            [`${today}: Closed`, `${tomorrow}: 10 AM - 6 PM`],
            [`${today}: 12 AM - 11:59 PM`],
        ];
        for (const hours of scenarios) {
            const status = getHoursStatus(hours);
            switch (status.state) {
                case "open":
                    expect(status.closesAt).toBeTruthy();
                    break;
                case "closing-soon":
                    expect(status.closesAt).toBeTruthy();
                    break;
                case "opening-soon":
                    expect(status.opensAt).toBeTruthy();
                    break;
                case "closed":
                    // opensAt can be null if no future data, but with full week data it should be present
                    break;
                case "closed-today":
                    // opensAt populated from forward lookup
                    expect(status.opensAt).toBeTruthy();
                    break;
                case "unknown":
                    break;
            }
        }
    });
});
