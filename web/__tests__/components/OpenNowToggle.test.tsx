import { OpenNowToggle } from "@/components/FilterUtilities";
import { OpenNowContext } from "@/contexts/FilterContext";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

function TestHarness() {
    const [openNow, setOpenNow] = useState(false);

    return (
        <OpenNowContext.Provider value={{ openNow, setOpenNow, openNowCount: 12 }}>
            <OpenNowToggle />
        </OpenNowContext.Provider>
    );
}

describe("OpenNowToggle", () => {
    it("toggles the one-line switch row", async () => {
        const user = userEvent.setup();
        render(<TestHarness />);

        const toggle = screen.getByRole("switch", { name: "Open Now, 12 Places" });
        expect(toggle).toHaveAttribute("aria-checked", "false");
        expect(toggle).toHaveClass("w-full", "h-11", "rounded-xl", "shadow-xs");
        expect(toggle).toHaveTextContent("Open Now · 12 Places");
        expect(toggle.querySelector("svg")).toHaveClass("h-4", "w-4", "text-emerald-500");

        await user.click(toggle);

        expect(toggle).toHaveAttribute("aria-checked", "true");
    });
});
