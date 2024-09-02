import Link from "next/link"
import { Icons } from "@/components/icons"

// className="hidden sm:flex gap-6 md:gap-10"

export function MainNavigation() {
    return (
        <div className="hidden sm:flex gap-6 md:gap-10">
            {/* <Link href="/" className="flex items-center space-x-2">
                <Icons.logo className="h-6 w-6" />
                <span className="inline-block font-bold">Charlotte Third Places</span>
            </Link> */}
            <nav className="flex gap-6">
                <Link
                    href="/"
                    className="flex items-center text-sm font-medium text-muted-foreground"
                >
                    Home
                </Link>

                <Link
                    href="/map"
                    className="flex items-center text-sm font-medium text-muted-foreground"
                >
                    Map
                </Link>
                <Link
                    href="/contribute"
                    className="flex items-center text-sm font-medium text-muted-foreground"
                >
                    Contribute
                </Link>
                <Link
                    href="/about"
                    className="flex items-center text-sm font-medium text-muted-foreground"
                >
                    About
                </Link>
            </nav>
        </div>
    )
}