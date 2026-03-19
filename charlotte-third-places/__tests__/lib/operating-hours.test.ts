import { describe, it, expect, vi, afterEach } from "vitest";
import {
    parseHour24,
    parseTimeToMinutes,
    getClosingHour,
    getDayTimeRange,
    isOpenLate,
    injectOpenLateTags,
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

    it("returns closed-today for Closed day", () => {
        // This only works if today matches — test the logic directly
        const today = new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            timeZone: "America/New_York",
        }).format(new Date());
        const hours = [`${today}: Closed`];
        expect(getHoursStatus(hours)).toEqual({ state: "closed-today" });
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
