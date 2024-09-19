import Link from "next/link"

export function MainNavigation() {
    return (
        <div className="hidden sm:flex gap-6 md:gap-10">
            <nav className="flex gap-6">
                <Link
                    href="/"
                    className="flex items-center text-sm font-medium text-muted-foreground custom-hover"
                >
                    Home
                </Link>

                <Link
                    href="/map"
                    className="flex items-center text-sm font-medium text-muted-foreground custom-hover"
                >
                    Map
                </Link>
                <Link
                    href="/contribute"
                    className="flex items-center text-sm font-medium text-muted-foreground custom-hover"
                >
                    Contribute
                </Link>
                <Link
                    href="/about"
                    className="flex items-center text-sm font-medium text-muted-foreground custom-hover"
                >
                    About
                </Link>
            </nav>
        </div>
    )
}