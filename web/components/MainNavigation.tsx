import Link from "next/link"

const navLinkClasses = "flex items-center text-sm font-medium text-muted-foreground hover:text-secondary hover:underline hover:underline-offset-4"

export function MainNavigation() {
    return (
        <div className="hidden sm:flex gap-6 md:gap-10">
            <nav className="flex gap-6">
                <Link href="/" className={navLinkClasses}>
                    Home
                </Link>
                <Link href="/map" className={navLinkClasses}>
                    Map
                </Link>
                <Link href="/chat" className={navLinkClasses}>
                    Chat
                </Link>
                <Link href="/contribute" className={navLinkClasses}>
                    Contribute
                </Link>
                <Link href="/about" className={navLinkClasses}>
                    About
                </Link>
            </nav>
        </div>
    )
}