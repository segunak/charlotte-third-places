import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    /** Size of the spinner. "default" is h-12 w-12, "sm" is h-6 w-6 */
    size?: "default" | "sm";
    /** Additional classes for the spinner element itself */
    className?: string;
}

/**
 * Consistent loading spinner used throughout the application.
 * This component only renders the spinner itself - wrap it in a container
 * with flex centering as needed for your layout.
 */
export function LoadingSpinner({ size = "default", className }: LoadingSpinnerProps) {
    return (
        <div
            className={cn(
                "loader animate-spin ease-linear rounded-full border-4 border-t-4 border-primary border-t-transparent",
                size === "default" ? "h-12 w-12" : "h-6 w-6",
                className
            )}
        />
    );
}
