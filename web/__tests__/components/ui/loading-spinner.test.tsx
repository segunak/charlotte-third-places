import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

describe("LoadingSpinner", () => {
    it("renders with default size", () => {
        const { container } = render(<LoadingSpinner />);
        const spinner = container.firstChild as HTMLElement;
        expect(spinner).toBeInTheDocument();
        expect(spinner).toHaveClass("h-12", "w-12");
    });

    it("renders with small size variant", () => {
        const { container } = render(<LoadingSpinner size="sm" />);
        const spinner = container.firstChild as HTMLElement;
        expect(spinner).toHaveClass("h-6", "w-6");
    });

    it("applies custom className", () => {
        const { container } = render(<LoadingSpinner className="custom-class" />);
        const spinner = container.firstChild as HTMLElement;
        expect(spinner).toHaveClass("custom-class");
    });

    it("has proper animation classes", () => {
        const { container } = render(<LoadingSpinner />);
        const spinner = container.firstChild as HTMLElement;
        expect(spinner).toHaveClass("animate-spin");
    });

    it("has loader class for identification", () => {
        const { container } = render(<LoadingSpinner />);
        const spinner = container.firstChild as HTMLElement;
        expect(spinner).toHaveClass("loader");
    });

    it("has rounded-full class for circular shape", () => {
        const { container } = render(<LoadingSpinner />);
        const spinner = container.firstChild as HTMLElement;
        expect(spinner).toHaveClass("rounded-full");
    });

    it("has border classes for spinner styling", () => {
        const { container } = render(<LoadingSpinner />);
        const spinner = container.firstChild as HTMLElement;
        expect(spinner).toHaveClass("border-4", "border-t-4", "border-primary", "border-t-transparent");
    });
});
