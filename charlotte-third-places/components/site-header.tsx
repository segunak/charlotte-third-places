import Link from "next/link"
import { Icons } from "@/components/icons"
import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { MainNavigation } from "@/components/main-navigation"

export function SiteHeader() {
    return (
        <header className="bg-background sticky top-0 z-40 w-full border-b">
            <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">

                <div className="sm:flex gap-6 md:gap-10 items-center">
                    <Link href="/" className="flex items-center space-x-2">
                        <Icons.logo className="h-6 w-6" />
                        <span className="hidden sm:inline-block font-bold">Charlotte Third Places</span>
                    </Link>
                    <MainNavigation />
                </div>

                <div className="flex flex-1 items-center justify-end space-x-4">
                    <nav className="flex items-center space-x-1">
                        <Link
                            href="https://github.com/segunak/charlotte-third-places"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <div
                                className={buttonVariants({
                                    size: "icon",
                                    variant: "ghost",
                                })}
                            >
                                <Icons.gitHub className="h-5 w-5" />
                                <span className="sr-only">GitHub</span>
                            </div>
                        </Link>
                        <Link
                            href="https://www.linkedin.com/in/segunakinyemi/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <div
                                className={buttonVariants({
                                    size: "icon",
                                    variant: "ghost",
                                })}
                            >
                                <Icons.linkedin className="h-5 w-5" />
                                <span className="sr-only">LinkedIn</span>
                            </div>
                        </Link>
                        <Link
                            href="https://segunakinyemi.com/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <div
                                className={buttonVariants({
                                    size: "icon",
                                    variant: "ghost",
                                })}
                            >
                                <Icons.link className="h-5 w-5" />
                                <span className="sr-only">Personal Website</span>
                            </div>
                        </Link>
                        <ThemeToggle />
                    </nav>
                </div>
            </div>
        </header>
    )
} 